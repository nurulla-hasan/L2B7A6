import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { PaymentGateway, PaymentStatus, Role } from '../../../generated/prisma/client';
import config from '../../config/index';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { paymentService } from './payment.service';

const initiateBkashPayment: RequestHandler = catchAsync(async (req, res) => {
  const result = await paymentService.initiateBkashPayment(
    req.user?.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'bKash payment checkout session created successfully',
    data: result,
  });
});

const handleBkashCallback: RequestHandler = catchAsync(async (req, res) => {
  const paymentID = req.query.paymentID as string | undefined;
  const status = req.query.status as string | undefined;

  const result = await paymentService.handleBkashCallback({ paymentID, status });

  // If format=json requested (e.g. Postman test), send JSON response
  if (req.query.format === 'json') {
    sendResponse(res, {
      statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
      success: result.success,
      message: result.success
        ? 'Payment completed successfully'
        : 'Payment was not successful',
      data: result.data,
    });
    return;
  }

  // Otherwise redirect to frontend URL
  if (result.redirectUrl) {
    res.redirect(result.redirectUrl);
    return;
  }

  res.redirect(`${config.frontend_url}/payment/result`);
});

const getMyPayments: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const status = req.query.status as PaymentStatus | undefined;

  const result = await paymentService.getMyPaymentsFromDB(req.user?.id as string, {
    page,
    limit,
    status,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My payments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getAllPayments: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const status = req.query.status as PaymentStatus | undefined;
  const gateway = req.query.gateway as PaymentGateway | undefined;

  const result = await paymentService.getAllPaymentsFromDB({
    page,
    limit,
    status,
    gateway,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All payments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getPaymentById: RequestHandler = catchAsync(async (req, res) => {
  const result = await paymentService.getPaymentByIdFromDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment details retrieved successfully',
    data: result,
  });
});

export const paymentController = {
  initiateBkashPayment,
  handleBkashCallback,
  getMyPayments,
  getAllPayments,
  getPaymentById,
};

