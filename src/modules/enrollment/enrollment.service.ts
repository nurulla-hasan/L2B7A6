import httpStatus from 'http-status';
import {
  AuditAction,
  EnrollmentStatus,
  type Prisma,
  Role,
  UserStatus,
} from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import { enrollmentInclude, studentSelect } from './enrollment.constants';
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentStatusInput,
} from './enrollment.validation';

const enrollStudentIntoDB = async (studentId: string, payload: CreateEnrollmentInput) => {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: Role.STUDENT, status: UserStatus.ACTIVE },
  });
  if (!student) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User must be an active student');
  }

  const offering = await prisma.courseOffering.findFirst({
    where: { id: payload.courseOfferingId, deletedAt: null },
    include: { course: true, semester: true },
  });
  if (!offering) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course offering not found');
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseOfferingId: {
        studentId,
        courseOfferingId: payload.courseOfferingId,
      },
    },
  });

  if (
    existing &&
    (existing.status === EnrollmentStatus.ENROLLED ||
      existing.status === EnrollmentStatus.PENDING_PAYMENT)
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You are already enrolled or pending payment for this course offering',
    );
  }

  const conflictCourse = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PENDING_PAYMENT] },
      courseOffering: {
        courseId: offering.courseId,
        semesterId: offering.semesterId,
        deletedAt: null,
        id: { not: offering.id },
      },
    },
    include: { courseOffering: true },
  });

  if (conflictCourse) {
    throw new AppError(
      httpStatus.CONFLICT,
      `You are already enrolled in section '${conflictCourse.courseOffering.section}' of this course in this semester`,
    );
  }

  const activeCount = await prisma.enrollment.count({
    where: {
      courseOfferingId: payload.courseOfferingId,
      status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PENDING_PAYMENT] },
    },
  });

  if (activeCount >= offering.capacity) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Course section is full. Capacity reached.');
  }

  const enrollment =
    existing && existing.status === EnrollmentStatus.DROPPED
      ? await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: EnrollmentStatus.PENDING_PAYMENT },
          include: enrollmentInclude,
        })
      : await prisma.enrollment.create({
          data: {
            studentId,
            courseOfferingId: payload.courseOfferingId,
            status: EnrollmentStatus.PENDING_PAYMENT,
          },
          include: enrollmentInclude,
        });

  await createAuditLog({
    userId: studentId,
    action: AuditAction.ENROLL_COURSE,
    resource: 'Enrollment',
    resourceId: enrollment.id,
    details: {
      courseOfferingId: offering.id,
      courseCode: offering.course.code,
      courseTitle: offering.course.title,
      semesterName: offering.semester.name,
      section: offering.section,
      fee: offering.fee,
    },
  });

  return enrollment;
};

const dropEnrollmentFromDB = async (enrollmentId: string, studentId: string) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      courseOffering: {
        include: { course: true },
      },
    },
  });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  if (enrollment.studentId !== studentId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only drop your own enrollment');
  }

  if (enrollment.status === EnrollmentStatus.DROPPED) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Enrollment is already dropped');
  }

  const dropped = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: EnrollmentStatus.DROPPED },
    include: enrollmentInclude,
  });

  await createAuditLog({
    userId: studentId,
    action: AuditAction.DROP_COURSE,
    resource: 'Enrollment',
    resourceId: dropped.id,
    details: {
      courseOfferingId: dropped.courseOfferingId,
      courseCode: dropped.courseOffering.course.code,
      section: dropped.courseOffering.section,
    },
  });

  return dropped;
};

const getMyEnrollmentsFromDB = async (
  studentId: string,
  query: { page?: number; limit?: number; status?: EnrollmentStatus },
) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const whereCondition: Prisma.EnrollmentWhereInput = {
    studentId,
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, enrollments] = await Promise.all([
    prisma.enrollment.count({ where: whereCondition }),
    prisma.enrollment.findMany({
      where: whereCondition,
      include: enrollmentInclude,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: enrollments,
  };
};

const getOfferingEnrollmentsFromDB = async (
  offeringId: string,
  user: { id: string; role: Role },
) => {
  const offering = await prisma.courseOffering.findFirst({
    where: { id: offeringId, deletedAt: null },
  });

  if (!offering) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course offering not found');
  }

  if (user.role === Role.TEACHER && offering.teacherId !== user.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only view enrollments for your assigned courses',
    );
  }

  return await prisma.enrollment.findMany({
    where: { courseOfferingId: offeringId },
    include: {
      student: studentSelect,
      payments: {
        select: { id: true, amount: true, status: true, transactionId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getAllEnrollmentsFromDB = async (query: {
  page?: number;
  limit?: number;
  status?: EnrollmentStatus;
  studentId?: string;
  courseOfferingId?: string;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const whereCondition: Prisma.EnrollmentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.studentId ? { studentId: query.studentId } : {}),
    ...(query.courseOfferingId ? { courseOfferingId: query.courseOfferingId } : {}),
  };

  const [total, enrollments] = await Promise.all([
    prisma.enrollment.count({ where: whereCondition }),
    prisma.enrollment.findMany({
      where: whereCondition,
      include: {
        ...enrollmentInclude,
        student: studentSelect,
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: enrollments,
  };
};

const getEnrollmentByIdFromDB = async (
  id: string,
  user: { id: string; role: Role },
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      ...enrollmentInclude,
      student: studentSelect,
    },
  });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  if (user.role === Role.STUDENT && enrollment.studentId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only view your own enrollment');
  }

  if (user.role === Role.TEACHER && enrollment.courseOffering.teacherId !== user.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only view enrollments for your assigned courses',
    );
  }

  return enrollment;
};

const updateEnrollmentStatusIntoDB = async (
  id: string,
  payload: UpdateEnrollmentStatusInput,
) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
  });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  return await prisma.enrollment.update({
    where: { id },
    data: { status: payload.status },
    include: enrollmentInclude,
  });
};

export const enrollmentService = {
  enrollStudentIntoDB,
  dropEnrollmentFromDB,
  getMyEnrollmentsFromDB,
  getOfferingEnrollmentsFromDB,
  getAllEnrollmentsFromDB,
  getEnrollmentByIdFromDB,
  updateEnrollmentStatusIntoDB,
};

