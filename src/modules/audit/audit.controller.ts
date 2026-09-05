import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { AuditAction } from '../../../generated/prisma/client';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { auditService } from './audit.service';

const getAllAuditLogs: RequestHandler = catchAsync(async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const action = req.query.action as AuditAction | undefined;
  const resource = req.query.resource as string | undefined;

  const result = await auditService.getAllAuditLogsFromDB({ page, limit, action, resource });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Audit logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const auditController = {
  getAllAuditLogs,
};
