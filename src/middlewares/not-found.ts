import type { RequestHandler } from 'express';
import httpStatus from 'http-status';

export const notFound: RequestHandler = (req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: 'API route not found',
    error: {
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl,
      method: req.method,
    },
  });
};
