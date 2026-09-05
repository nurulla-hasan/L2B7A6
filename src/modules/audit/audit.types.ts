import type { AuditAction, Prisma } from '../../../generated/prisma/client';

export interface IAuditLogData {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Prisma.InputJsonValue;
}

