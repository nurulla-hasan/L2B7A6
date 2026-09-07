import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { Role } from '../../../generated/prisma/client';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { resultService } from './result.service';

const submitResult: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.submitResultIntoDB(req.user?.id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course marks submitted successfully',
    data: result,
  });
});

const updateResult: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.updateResultIntoDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Result updated successfully',
    data: result,
  });
});

const publishResults: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.publishResultsIntoDB(
    req.body,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getMyResults: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.getMyResultsFromDB(req.user?.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My academic results retrieved successfully',
    data: result,
  });
});

const getOfferingResults: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.getOfferingResultsFromDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course offering results retrieved successfully',
    data: result,
  });
});

const getAllResults: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const published = req.query.published !== undefined ? req.query.published === 'true' : undefined;

  const result = await resultService.getAllResultsFromDB({
    page,
    limit,
    published,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All results retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getResultById: RequestHandler = catchAsync(async (req, res) => {
  const result = await resultService.getResultByIdFromDB(
    req.params.id as string,
    req.user as { id: string; role: Role },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Result details retrieved successfully',
    data: result,
  });
});

export const resultController = {
  submitResult,
  updateResult,
  publishResults,
  getMyResults,
  getOfferingResults,
  getAllResults,
  getResultById,
};
