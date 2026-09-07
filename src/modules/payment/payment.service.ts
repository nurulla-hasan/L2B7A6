import httpStatus from 'http-status';
import {
  AuditAction,
  EnrollmentStatus,
  PaymentGateway,
  PaymentStatus,
  type Prisma,
  Role,
} from '../../../generated/prisma/client';
import config from '../../config/index';
import { getBkashIdToken } from '../../lib/bkash';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import { paymentInclude } from './payment.constants';
import type {
  BkashCreateResponse,
  BkashExecuteResponse,
} from './payment.interface';
import type { InitiatePaymentInput } from './payment.validation';

const initiateBkashPayment = async (
  studentId: string,
  payload: InitiatePaymentInput,
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: payload.enrollmentId },
    include: {
      student: true,
      courseOffering: { include: { course: true, semester: true } },
    },
  });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment record not found');
  }

  if (enrollment.studentId !== studentId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to pay for this enrollment',
    );
  }

  if (enrollment.status === EnrollmentStatus.ENROLLED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Enrollment fee is already paid');
  }

  if (enrollment.status === EnrollmentStatus.DROPPED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot pay for a dropped enrollment');
  }

  const amount = enrollment.courseOffering.fee;
  const transactionId = `TRX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const bkashIdToken = await getBkashIdToken();
  const response = await fetch(`${config.bkash_base_url}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: bkashIdToken,
      'X-App-Key': config.bkash_app_key || '',
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: enrollment.student.email,
      callbackURL: config.bkash_callback_url,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: enrollment.id,
    }),
  });

  const createResult = (await response.json()) as BkashCreateResponse;
  if (createResult.statusCode !== '0000' || !createResult.paymentID) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      createResult.statusMessage || 'bKash payment creation failed',
    );
  }

  const payment = await prisma.payment.create({
    data: {
      enrollmentId: enrollment.id,
      amount,
      transactionId,
      bkashPaymentId: createResult.paymentID,
      gateway: PaymentGateway.BKASH,
      status: PaymentStatus.PENDING,
      paymentDetails: createResult as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    paymentId: payment.id,
    paymentUrl: createResult.bkashURL,
    bkashPaymentId: createResult.paymentID,
    amount,
  };
};

const handleBkashCallback = async (query: { paymentID?: string; status?: string }) => {
  const { paymentID, status } = query;
  if (!paymentID || !status) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment ID and status are required');
  }

  const payment = await prisma.payment.findFirst({
    where: { bkashPaymentId: paymentID },
    include: {
      enrollment: {
        include: {
          courseOffering: { include: { course: true, semester: true } },
          student: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Matching payment record not found');
  }

  if (payment.status === PaymentStatus.PAID) {
    return {
      success: true,
      redirectUrl: `${config.frontend_url}/payment/success?paymentId=${payment.id}`,
      data: payment,
    };
  }

  if (status === 'success') {
    const bkashIdToken = await getBkashIdToken();
    const executeRes = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: bkashIdToken,
          'X-App-Key': config.bkash_app_key || '',
        },
        body: JSON.stringify({ paymentID }),
      },
    );

    const executeResult = (await executeRes.json()) as BkashExecuteResponse;
    if (executeResult.statusCode === '0000' && executeResult.transactionStatus === 'Completed') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: executeResult.paymentExecuteTime
              ? new Date(executeResult.paymentExecuteTime)
              : new Date(),
            transactionId: executeResult.trxID || payment.transactionId,
            paymentDetails: executeResult as unknown as Prisma.InputJsonValue,
          },
        });

        await tx.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: EnrollmentStatus.ENROLLED },
        });

        await createAuditLog(
          {
            userId: payment.enrollment.studentId,
            action: AuditAction.PAYMENT_SUCCESS,
            resource: 'Payment',
            resourceId: payment.id,
            details: {
              enrollmentId: payment.enrollmentId,
              amount: payment.amount,
              trxId: executeResult.trxID,
              courseCode: payment.enrollment.courseOffering.course.code,
            },
          },
          tx,
        );
      });

      return {
        success: true,
        redirectUrl: `${config.frontend_url}/payment/success?paymentId=${payment.id}&trxId=${executeResult.trxID}`,
        data: executeResult,
      };
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED, paymentDetails: executeResult as unknown as Prisma.InputJsonValue },
    });

    return {
      success: false,
      redirectUrl: `${config.frontend_url}/payment/failure?paymentId=${payment.id}`,
      data: executeResult,
    };
  }

  const newStatus = status === 'cancel' ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
  await prisma.payment.update({ where: { id: payment.id }, data: { status: newStatus } });

  return {
    success: false,
    redirectUrl: `${config.frontend_url}/payment/${status}?paymentId=${payment.id}`,
    data: { paymentID, status },
  };
};

const getMyPaymentsFromDB = async (
  studentId: string,
  query: { page?: number; limit?: number; status?: PaymentStatus },
) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const whereCondition: Prisma.PaymentWhereInput = {
    enrollment: { studentId },
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where: whereCondition }),
    prisma.payment.findMany({
      where: whereCondition,
      include: paymentInclude,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    data: payments,
  };
};

const getAllPaymentsFromDB = async (query: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  gateway?: PaymentGateway;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const whereCondition: Prisma.PaymentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.gateway ? { gateway: query.gateway } : {}),
  };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where: whereCondition }),
    prisma.payment.findMany({
      where: whereCondition,
      include: paymentInclude,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    data: payments,
  };
};

const getPaymentByIdFromDB = async (id: string, user: { id: string; role: Role }) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: paymentInclude,
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (user.role === Role.STUDENT && payment.enrollment.studentId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You cannot view other students payments');
  }

  return payment;
};

export const paymentService = {
  initiateBkashPayment,
  handleBkashCallback,
  getMyPaymentsFromDB,
  getAllPaymentsFromDB,
  getPaymentByIdFromDB,
};

