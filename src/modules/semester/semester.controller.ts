import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { semesterService } from './semester.service';
import type { GetSemestersQueryInput } from './semester.validation';

const createSemester: RequestHandler = catchAsync(async (req, res) => {
  const result = await semesterService.createSemesterIntoDB(req.body, req.user?.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Semester created successfully',
    data: result,
  });
});

const getAllSemesters: RequestHandler = catchAsync(async (req, res) => {
  const query = req.query as unknown as GetSemestersQueryInput;
  const result = await semesterService.getAllSemestersFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Semesters retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getSemesterById: RequestHandler = catchAsync(async (req, res) => {
  const result = await semesterService.getSemesterByIdFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Semester retrieved successfully',
    data: result,
  });
});

const updateSemester: RequestHandler = catchAsync(async (req, res) => {
  const result = await semesterService.updateSemesterIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Semester updated successfully',
    data: result,
  });
});

const softDeleteSemester: RequestHandler = catchAsync(async (req, res) => {
  const result = await semesterService.softDeleteSemesterFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Semester deleted successfully',
    data: result,
  });
});

export const semesterController = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  softDeleteSemester,
};
