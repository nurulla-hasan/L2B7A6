import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { EnrollmentStatus, Role } from '../../../generated/prisma/client';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { enrollmentService } from './enrollment.service';

const enrollStudent: RequestHandler = catchAsync(async (req, res) => {
  const result = await enrollmentService.enrollStudentIntoDB(
    req.user?.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Enrolled in course offering successfully. Complete payment to confirm seat.',
    data: result,
  });
});

const getMyEnrollments: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const status = req.query.status as EnrollmentStatus | undefined;

  const result = await enrollmentService.getMyEnrollmentsFromDB(
    req.user?.id as string,
    {
      page,
      limit,
      status,
    },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My enrollments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOfferingEnrollments: RequestHandler = catchAsync(async (req, res) => {
  const result = await enrollmentService.getOfferingEnrollmentsFromDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offering enrollments retrieved successfully',
    data: result,
  });
});

const getAllEnrollments: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const status = req.query.status as EnrollmentStatus | undefined;
  const studentId = req.query.studentId as string | undefined;
  const courseOfferingId = req.query.courseOfferingId as string | undefined;

  const result = await enrollmentService.getAllEnrollmentsFromDB({
    page,
    limit,
    status,
    studentId,
    courseOfferingId,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All enrollments retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getEnrollmentById: RequestHandler = catchAsync(async (req, res) => {
  const result = await enrollmentService.getEnrollmentByIdFromDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment retrieved successfully',
    data: result,
  });
});

const dropEnrollment: RequestHandler = catchAsync(async (req, res) => {
  const result = await enrollmentService.dropEnrollmentFromDB(
    req.params.id as string,
    req.user?.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offering dropped successfully',
    data: result,
  });
});

const updateEnrollmentStatus: RequestHandler = catchAsync(async (req, res) => {
  const result = await enrollmentService.updateEnrollmentStatusIntoDB(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Enrollment status updated successfully',
    data: result,
  });
});

export const enrollmentController = {
  enrollStudent,
  getMyEnrollments,
  getOfferingEnrollments,
  getAllEnrollments,
  getEnrollmentById,
  dropEnrollment,
  updateEnrollmentStatus,
};

