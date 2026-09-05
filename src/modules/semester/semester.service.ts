import httpStatus from 'http-status';
import { AuditAction, type Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import type {
  CreateSemesterInput,
  GetSemestersQueryInput,
  UpdateSemesterInput,
} from './semester.validation';

const createSemesterIntoDB = async (payload: CreateSemesterInput, adminId?: string) => {
  const existingSemester = await prisma.semester.findFirst({
    where: {
      name: payload.name,
      year: payload.year,
      deletedAt: null,
    },
  });

  if (existingSemester) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Semester '${payload.name} ${payload.year}' already exists.`,
    );
  }

  const result = await prisma.semester.create({
    data: {
      name: payload.name,
      year: payload.year,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    },
  });

  await createAuditLog({
    userId: adminId,
    action: AuditAction.CREATE_SEMESTER,
    resource: 'Semester',
    resourceId: result.id,
    details: { name: result.name, year: result.year },
  });

  return result;
};

const getAllSemestersFromDB = async (query: GetSemestersQueryInput) => {
  const { page, limit, searchTerm, year, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.SemesterWhereInput[] = [{ deletedAt: null }];

  if (searchTerm?.trim()) {
    andConditions.push({
      name: { contains: searchTerm.trim(), mode: 'insensitive' },
    });
  }

  if (year) {
    andConditions.push({ year });
  }

  const whereCondition: Prisma.SemesterWhereInput = { AND: andConditions };

  const orderByMap: Record<string, Prisma.SemesterOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    year_asc: { year: 'asc' },
    year_desc: { year: 'desc' },
  };

  const orderBy = orderByMap[sortBy || 'newest'] || { createdAt: 'desc' };

  const [total, semesters] = await Promise.all([
    prisma.semester.count({ where: whereCondition }),
    prisma.semester.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: semesters,
  };
};

const getSemesterByIdFromDB = async (id: string) => {
  const semester = await prisma.semester.findFirst({
    where: { id, deletedAt: null },
    include: {
      courseOfferings: {
        where: { deletedAt: null },
        include: {
          course: true,
          teacher: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, 'Semester not found');
  }

  return semester;
};

const updateSemesterIntoDB = async (id: string, payload: UpdateSemesterInput) => {
  await getSemesterByIdFromDB(id);

  const updateData: Prisma.SemesterUpdateInput = {};
  if (payload.startDate) updateData.startDate = new Date(payload.startDate);
  if (payload.endDate) updateData.endDate = new Date(payload.endDate);

  const updatedSemester = await prisma.semester.update({
    where: { id },
    data: updateData,
  });

  return updatedSemester;
};

const softDeleteSemesterFromDB = async (id: string) => {
  await getSemesterByIdFromDB(id);

  const deletedSemester = await prisma.semester.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return deletedSemester;
};

export const semesterService = {
  createSemesterIntoDB,
  getAllSemestersFromDB,
  getSemesterByIdFromDB,
  updateSemesterIntoDB,
  softDeleteSemesterFromDB,
};
