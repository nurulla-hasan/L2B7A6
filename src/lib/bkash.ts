import httpStatus from 'http-status';
import config from '../config/index';
import { AppError } from '../utils/app-error';
import { getCache, getCacheTtl, setCache } from './redis';

const ID_TOKEN_KEY = 'bkash:idToken';
const REFRESH_TOKEN_KEY = 'bkash:refreshToken';

interface BkashTokenResponse {
  statusCode?: string;
  statusMessage?: string;
  id_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

export const getBkashIdToken = async (): Promise<string> => {
  try {
    let bkashIdToken = await getCache<string>(ID_TOKEN_KEY);
    const bkashIdTokenTTL = await getCacheTtl(ID_TOKEN_KEY);

    const bkashRefreshToken = await getCache<string>(REFRESH_TOKEN_KEY);
    const bkashRefreshTokenTTL = await getCacheTtl(REFRESH_TOKEN_KEY);

    // If ID token expired/near expiry (<= 10 mins) and valid refresh token exists (> 10 mins)
    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            username: config.bkash_username || '',
            password: config.bkash_password || '',
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (!refreshResponse.ok) {
        throw new AppError(httpStatus.BAD_GATEWAY, 'bKash Access Token Refresh Failed');
      }

      const refreshResult = (await refreshResponse.json()) as BkashTokenResponse;
      bkashIdToken = refreshResult.id_token;

      // Cache id_token for 1 hour
      await setCache(ID_TOKEN_KEY, bkashIdToken, 60 * 60);
      return bkashIdToken;
    }

    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    // Grant new tokens
    const grantResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          username: config.bkash_username || '',
          password: config.bkash_password || '',
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!grantResponse.ok) {
      throw new AppError(httpStatus.BAD_GATEWAY, 'bKash Access Token Grant Failed');
    }

    const grantResult = (await grantResponse.json()) as BkashTokenResponse;

    // Cache id_token for 1 hour
    await setCache(ID_TOKEN_KEY, grantResult.id_token, 60 * 60);

    // Cache refresh_token for 28 days
    if (grantResult.refresh_token) {
      await setCache(REFRESH_TOKEN_KEY, grantResult.refresh_token, 60 * 60 * 24 * 28);
    }

    return grantResult.id_token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'bKash Authentication Error';
    throw new AppError(httpStatus.BAD_GATEWAY, message);
  }
};

