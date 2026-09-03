import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthProvider, type User } from '../../../generated/prisma/client';

import config from '../../config/index';
import { sendPasswordResetEmail, sendVerificationEmail } from '../../lib/email';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { jwtUtils } from '../../utils/jwt';

import type { IRegisterUser } from './auth.types';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateMeInput,
} from './auth.validation';
import { otpService } from './otp.service';

const loginUserIntoDB = (user: User) => {
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const registerUserIntoDB = async (payload: IRegisterUser): Promise<{ email: string }> => {
  const { name, email, password, role = 'STUDENT', phone } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const otp = await otpService.savePendingUser({
    name,
    email,
    passwordHash,
    role,
    phone,
  });

  await sendVerificationEmail(email, otp, name);

  return { email };
};

const verifyEmailAndCreateUserIntoDB = async (email: string, otp: string) => {
  const pendingUser = await otpService.verifyRegistrationOtp(email, otp);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'An account with this email already exists');
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.passwordHash,
        role: pendingUser.role || 'STUDENT',
        phone: pendingUser.phone || '',
        authProvider: AuthProvider.CREDENTIAL,
        emailVerified: true,
      },
    });

    if (newUser.role === 'TEACHER') {
      await tx.teacherProfile.create({
        data: { userId: newUser.id },
      });
    } else if (newUser.role === 'STUDENT') {
      await tx.studentProfile.create({
        data: { userId: newUser.id },
      });
    }

    return newUser;
  });

  await otpService.deletePendingUser(email);

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );
  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const resendVerificationOtpIntoDB = async (email: string): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered and active');
  }

  const newOtp = await otpService.resendRegistrationOtp(email);
  await sendVerificationEmail(email, newOtp);
};

const refreshAuthTokensFromDB = async (refreshToken: string) => {
  let tokenPayload: JwtPayload;

  try {
    tokenPayload = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is invalid or expired');
  }

  const rawUser = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
  });

  if (!rawUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (rawUser.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is disabled');
  }
  if (!rawUser.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified');
  }

  const jwtPayload = {
    id: rawUser.id,
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role,
    status: rawUser.status,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );
  const newRefreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const getMeFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: true,
      studentProfile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { password, googleId, imagePublicId, ...safeUser } = user;

  return {
    ...safeUser,
    hasPassword: Boolean(password),
  };
};

const updateMeIntoDB = async (userId: string, payload: UpdateMeInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    include: {
      teacherProfile: true,
      studentProfile: true,
    },
  });

  const { password, googleId, imagePublicId, ...safeUser } = user;
  return safeUser;
};

const changePasswordIntoDB = async (userId: string, payload: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.password) {
    const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Current password does not match');
    }

    const isSame = await bcrypt.compare(payload.newPassword, user.password);
    if (isSame) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'New password cannot be the same as current password',
      );
    }
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: 'Password changed successfully' };
};

const forgotPasswordIntoDB = async (payload: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No account found with this email address');
  }

  if (user.status === 'BLOCKED') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is suspended');
  }

  const otp = await otpService.savePasswordResetOtp(user.email);
  await sendPasswordResetEmail(user.email, otp, user.name);

  return { message: 'A 6-digit verification code has been sent to your email' };
};

const resendPasswordResetOtpIntoDB = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const newOtp = await otpService.resendPasswordResetOtp(email);
  await sendPasswordResetEmail(email, newOtp, user.name);

  return { message: 'A new password reset code has been sent' };
};

const resetPasswordIntoDB = async (payload: ResetPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  await otpService.verifyPasswordResetOtp(payload.email, payload.otp);

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await otpService.deletePasswordResetOtp(payload.email);

  return { message: 'Password reset successful. You can now login with your new password.' };
};

export const authService = {
  loginUserIntoDB,
  registerUserIntoDB,
  verifyEmailAndCreateUserIntoDB,
  resendVerificationOtpIntoDB,
  refreshAuthTokensFromDB,
  getMeFromDB,
  updateMeIntoDB,
  changePasswordIntoDB,
  forgotPasswordIntoDB,
  resendPasswordResetOtpIntoDB,
  resetPasswordIntoDB,
};
