import { type AuditAction, Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import type { IAuditLogData } from './audit.types';

export const createAuditLog = async (
  data: IAuditLogData,
  txPrisma: Prisma.TransactionClient | typeof prisma = prisma,
) => {
  try {
    return await txPrisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        details: data.details || Prisma.JsonNull,
      },
    });
  } catch (err) {
    // Non-blocking log failure
    console.error('Failed to create audit log:', err);
  }
};

const getAllAuditLogsFromDB = async (query: {
  page?: number;
  limit?: number;
  action?: AuditAction;
  resource?: string;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (query.action) {
    andConditions.push({ action: query.action });
  }

  if (query.resource?.trim()) {
    andConditions.push({ resource: { contains: query.resource.trim(), mode: 'insensitive' } });
  }

  const whereCondition: Prisma.AuditLogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: whereCondition }),
    prisma.auditLog.findMany({
      where: whereCondition,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: logs,
  };
};

export const auditService = {
  createAuditLog,
  getAllAuditLogsFromDB,
};
