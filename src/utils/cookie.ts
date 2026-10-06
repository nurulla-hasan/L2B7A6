import type { Response } from 'express';
import config from '../config/index';

const isProduction = config.node_env === 'production';

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

// 15 minutes for access token (in milliseconds)
export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;

// 15 days for refresh token (in milliseconds)
export const REFRESH_TOKEN_MAX_AGE = 15 * 24 * 60 * 60 * 1000;

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string,
): void => {
  res.cookie('accessToken', accessToken, {
    ...authCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...authCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', authCookieOptions);
  res.clearCookie('refreshToken', authCookieOptions);
};
