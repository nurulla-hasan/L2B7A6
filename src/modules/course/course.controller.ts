import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { courseService } from './course.service';
import { createCourseValidationSchema, updateCourseValidationSchema } from './course.validation';

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const rawData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const zodValidationResult = createCourseValidationSchema.safeParse(rawData);

  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0]?.message || 'Validation failed',
    );
  }

  const payload = zodValidationResult.data;

  const result = await courseService.createCourseIntoDB(payload, files, req.user?.id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const searchTerm = req.query.searchTerm as string | undefined;

  const result = await courseService.getAllCoursesFromDB({ page, limit, searchTerm });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courses retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const result = await courseService.getCourseByIdFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course retrieved successfully',
    data: result,
  });
});

const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const rawData = req.body.data ? JSON.parse(req.body.data) : req.body;
  const zodValidationResult = updateCourseValidationSchema.safeParse(rawData);

  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0]?.message || 'Validation failed',
    );
  }

  const payload = zodValidationResult.data;

  const result = await courseService.updateCourseIntoDB(req.params.id as string, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await courseService.deleteCourseFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const courseController = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
