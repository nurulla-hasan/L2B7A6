import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export const jwtUtils = {
  createToken: (
    payload: Record<string, unknown>,
    secret: string,
    expiresIn: string | number,
  ): string => {
    return jwt.sign(payload, secret, {
      expiresIn,
    } as SignOptions);
  },

  verifyToken: (token: string, secret: string): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
  },
};
