import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { courseOfferingService } from './course-offering.service';

const createCourseOffering: RequestHandler = catchAsync(async (req, res) => {
  const result = await courseOfferingService.createCourseOfferingIntoDB(
    req.body,
    req.user?.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course offering created successfully',
    data: result,
  });
});

const getAllCourseOfferings: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const semesterId = req.query.semesterId as string | undefined;
  const courseId = req.query.courseId as string | undefined;
  const teacherId = req.query.teacherId as string | undefined;
  const section = req.query.section as string | undefined;

  const result = await courseOfferingService.getAllCourseOfferingsFromDB({
    page,
    limit,
    semesterId,
    courseId,
    teacherId,
    section,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offerings retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseOfferingById: RequestHandler = catchAsync(async (req, res) => {
  const result = await courseOfferingService.getCourseOfferingByIdFromDB(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offering retrieved successfully',
    data: result,
  });
});

const updateCourseOffering: RequestHandler = catchAsync(async (req, res) => {
  const result = await courseOfferingService.updateCourseOfferingIntoDB(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offering updated successfully',
    data: result,
  });
});

const deleteCourseOffering: RequestHandler = catchAsync(async (req, res) => {
  const result = await courseOfferingService.deleteCourseOfferingFromDB(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const courseOfferingController = {
  createCourseOffering,
  getAllCourseOfferings,
  getCourseOfferingById,
  updateCourseOffering,
  deleteCourseOffering,
};

