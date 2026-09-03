import { randomInt } from 'node:crypto';
import httpStatus from 'http-status';
import type { Role } from '../../../generated/prisma/enums.js';
import { deleteCache, getCache, getCacheTtl, setCache } from '../../lib/redis.js';
import { AppError } from '../../utils/app-error.js';

const OTP_EXPIRES_IN_SECONDS = 300;
const OTP_MAX_ATTEMPTS = 3;

export interface IPendingUser {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  phone?: string;
}

interface IRegistrationData extends IPendingUser {
  otp: string;
  attempts: number;
}

interface IPasswordResetData {
  email: string;
  otp: string;
  attempts: number;
}

const getRegistrationKey = (email: string): string => `registration:${email}`;
const getPasswordResetKey = (email: string): string => `password_reset:${email}`;

const generateOtp = (): string => {
  return randomInt(100000, 1000000).toString();
};

const savePendingUser = async (userData: IPendingUser): Promise<string> => {
  const otp = generateOtp();

  const registrationData: IRegistrationData = {
    ...userData,
    otp,
    attempts: OTP_MAX_ATTEMPTS,
  };

  await setCache(getRegistrationKey(userData.email), registrationData, OTP_EXPIRES_IN_SECONDS);

  return otp;
};

const verifyRegistrationOtp = async (
  email: string,
  submittedOtp: string,
): Promise<IPendingUser> => {
  const key = getRegistrationKey(email);
  const registrationData = await getCache<IRegistrationData>(key);

  if (!registrationData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Registration has expired. Please register again.',
      'OTP_EXPIRED',
    );
  }

  if (registrationData.attempts <= 0) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      'OTP attempts exceeded',
      'OTP_ATTEMPTS_EXCEEDED',
    );
  }

  if (registrationData.otp !== submittedOtp) {
    const remainingTime = await getCacheTtl(key);
    const updatedData = {
      ...registrationData,
      attempts: registrationData.attempts - 1,
    };

    await setCache(key, updatedData, Math.max(remainingTime, 1));

    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid verification code', 'INVALID_OTP');
  }

  return {
    name: registrationData.name,
    email: registrationData.email,
    passwordHash: registrationData.passwordHash,
    role: registrationData.role,
    phone: registrationData.phone,
  };
};

const resendRegistrationOtp = async (email: string): Promise<string> => {
  const key = getRegistrationKey(email);
  const registrationData = await getCache<IRegistrationData>(key);

  if (!registrationData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Registration session has expired. Please register again.',
      'OTP_EXPIRED',
    );
  }

  const newOtp = generateOtp();
  const updatedData: IRegistrationData = {
    ...registrationData,
    otp: newOtp,
    attempts: OTP_MAX_ATTEMPTS,
  };

  await setCache(key, updatedData, OTP_EXPIRES_IN_SECONDS);

  return newOtp;
};

const deletePendingUser = async (email: string): Promise<void> => {
  await deleteCache(getRegistrationKey(email));
};

const savePasswordResetOtp = async (email: string): Promise<string> => {
  const otp = generateOtp();

  const resetData: IPasswordResetData = {
    email,
    otp,
    attempts: OTP_MAX_ATTEMPTS,
  };

  await setCache(getPasswordResetKey(email), resetData, OTP_EXPIRES_IN_SECONDS);

  return otp;
};

const verifyPasswordResetOtp = async (email: string, submittedOtp: string): Promise<void> => {
  const key = getPasswordResetKey(email);
  const resetData = await getCache<IPasswordResetData>(key);

  if (!resetData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Password reset code has expired. Please request a new code.',
      'OTP_EXPIRED',
    );
  }

  if (resetData.attempts <= 0) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      'OTP attempts exceeded',
      'OTP_ATTEMPTS_EXCEEDED',
    );
  }

  if (resetData.otp !== submittedOtp) {
    const remainingTime = await getCacheTtl(key);
    const updatedData = {
      ...resetData,
      attempts: resetData.attempts - 1,
    };

    await setCache(key, updatedData, Math.max(remainingTime, 1));

    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid reset code', 'INVALID_OTP');
  }
};

const resendPasswordResetOtp = async (email: string): Promise<string> => {
  const newOtp = generateOtp();
  const resetData: IPasswordResetData = {
    email,
    otp: newOtp,
    attempts: OTP_MAX_ATTEMPTS,
  };

  await setCache(getPasswordResetKey(email), resetData, OTP_EXPIRES_IN_SECONDS);

  return newOtp;
};

const deletePasswordResetOtp = async (email: string): Promise<void> => {
  await deleteCache(getPasswordResetKey(email));
};

export const otpService = {
  savePendingUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  deletePendingUser,
  savePasswordResetOtp,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  deletePasswordResetOtp,
};
