import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { userService } from './user.service';
import type { GetUsersQueryInput } from './user.validation';

const getAllUsers: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.getAllUsersFromDB(
    req.query as unknown as GetUsersQueryInput,
    req.user?.id,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Users retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.getUserByIdFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User retrieved successfully',
    data: result,
  });
});

const createAdmin: RequestHandler = catchAsync(async (req, res) => {
  const result = await userService.createAdminIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Admin account created successfully',
    data: result,
  });
});

const updateUserStatus: RequestHandler = catchAsync(async (req, res) => {
  const currentUserId = req.user?.id as string;
  const result = await userService.updateUserStatusIntoDB(
    req.params.id as string,
    req.body,
    currentUserId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User status updated successfully',
    data: result,
  });
});

const updateUserRole: RequestHandler = catchAsync(async (req, res) => {
  const currentUserId = req.user?.id as string;
  const result = await userService.updateUserRoleIntoDB(
    req.params.id as string,
    req.body,
    currentUserId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User role updated successfully',
    data: result,
  });
});

const deleteUser: RequestHandler = catchAsync(async (req, res) => {
  const currentUserId = req.user?.id as string;
  const result = await userService.deleteUserFromDB(req.params.id as string, currentUserId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const uploadProfileImage: RequestHandler = catchAsync(async (req, res) => {
  const currentUserId = req.user?.id as string;
  const result = await userService.uploadProfileImageIntoDB(currentUserId, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile image updated successfully',
    data: result,
  });
});

export const userController = {
  getAllUsers,
  getUserById,
  createAdmin,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  uploadProfileImage,
};
