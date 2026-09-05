import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { User } from '../../../generated/prisma/client';

import config from '../../config/index';
import { isGoogleAuthConfigured, passport } from '../../config/passport';

import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';

import { authService } from './auth.service';

const loginUserWithPassport: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    (
      error: unknown,
      user: Express.User | false | null | undefined,
      info?: { message?: string },
    ) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return next(new AppError(httpStatus.UNAUTHORIZED, info?.message || 'Login failed'));
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

const loginUser = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Login failed');
  }

  const result = authService.loginUserIntoDB(req.user as unknown as User);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: result,
  });
});

const registerUser = catchAsync(async (req, res) => {
  const result = await authService.registerUserIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Verification code sent. Complete verification to activate your account.',
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmailAndCreateUserIntoDB(email, otp);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Email verification successful',
    data: result,
  });
});

const resendVerificationOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationOtpIntoDB(email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'A new verification code has been sent',
    data: null,
  });
});

const refreshAuthTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const result = await authService.refreshAuthTokensFromDB(refreshToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tokens refreshed successfully',
    data: result,
  });
});

const startGoogleLogin: RequestHandler = (req, res, next) => {
  if (!isGoogleAuthConfigured) {
    return next(
      new AppError(httpStatus.SERVICE_UNAVAILABLE, 'Google authentication is not configured'),
    );
  }

  const state = randomUUID();

  res.cookie('oauthState', state, {
    httpOnly: true,
    secure: config.node_env === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/v1/auth/google/callback',
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
};

const verifyGoogleLoginState: RequestHandler = (req, res, next) => {
  const stateFromGoogle = typeof req.query.state === 'string' ? req.query.state : '';
  const stateFromCookie = req.cookies?.oauthState;

  res.clearCookie('oauthState', {
    path: '/api/v1/auth/google/callback',
  });

  if (!stateFromGoogle || !stateFromCookie || stateFromGoogle !== stateFromCookie) {
    return next(new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in state is invalid'));
  }

  next();
};

const googleLoginCallback: RequestHandler = (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google login failed');
  }

  const result = authService.loginUserIntoDB(req.user as unknown as User);

  const redirectUrl = new URL('/auth/success', config.frontend_url || 'http://localhost:3000');
  redirectUrl.searchParams.set('accessToken', result.accessToken);
  redirectUrl.searchParams.set('refreshToken', result.refreshToken);

  res.redirect(redirectUrl.toString());
};

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMeFromDB(req.user?.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Current user profile retrieved',
    data: { user },
  });
});

const logoutUser: RequestHandler = (_req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Logout successful',
    data: null,
  });
};

const updateMe = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await authService.updateMeIntoDB(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: { user: result },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await authService.changePasswordIntoDB(userId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPasswordIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const resendResetOtp = catchAsync(async (req, res) => {
  const result = await authService.resendPasswordResetOtpIntoDB(req.body.email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPasswordIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const authController = {
  loginUser,
  loginUserWithPassport,
  registerUser,
  verifyEmail,
  resendVerificationOtp,
  refreshAuthTokens,
  startGoogleLogin,
  verifyGoogleLoginState,
  googleLoginCallback,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resendResetOtp,
  resetPassword,
  logoutUser,
};
