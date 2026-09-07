import httpStatus from 'http-status';
import { AuditAction, EnrollmentStatus, type Prisma, Role } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import { calculateGrade, resultInclude } from './result.constants';
import type { PublishResultInput, SubmitResultInput, UpdateResultInput } from './result.validation';

const submitResultIntoDB = async (teacherId: string, payload: SubmitResultInput) => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: payload.enrollmentId },
    include: {
      courseOffering: { include: { course: true, semester: true } },
    },
  });

  if (!enrollment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Enrollment not found');
  }

  if (enrollment.status !== EnrollmentStatus.ENROLLED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot submit result for student who is not confirmed enrolled',
    );
  }

  if (enrollment.courseOffering.teacherId !== teacherId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only submit marks for your own assigned course offering',
    );
  }

  const existingResult = await prisma.result.findUnique({
    where: { enrollmentId: payload.enrollmentId },
  });

  if (existingResult) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Result has already been submitted for this enrollment. Use update to edit marks.',
    );
  }

  const { grade } = calculateGrade(payload.marks);
  const isPublished = payload.published ?? false;

  const result = await prisma.result.create({
    data: {
      enrollmentId: payload.enrollmentId,
      teacherId,
      marks: payload.marks,
      grade,
      published: isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
    include: resultInclude,
  });

  await createAuditLog({
    userId: teacherId,
    action: AuditAction.SUBMIT_RESULT,
    resource: 'Result',
    resourceId: result.id,
    details: {
      enrollmentId: payload.enrollmentId,
      marks: payload.marks,
      grade,
      published: result.published,
      courseCode: enrollment.courseOffering.course.code,
    },
  });

  return result;
};

const updateResultIntoDB = async (
  resultId: string,
  user: { id: string; role: Role },
  payload: UpdateResultInput,
) => {
  const existing = await prisma.result.findUnique({
    where: { id: resultId },
    include: resultInclude,
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Result not found');
  }

  if (user.role === Role.TEACHER && existing.teacherId !== user.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You can only update results for your assigned courses',
    );
  }

  const newGrade =
    payload.marks !== undefined ? calculateGrade(payload.marks).grade : existing.grade;

  const updated = await prisma.result.update({
    where: { id: resultId },
    data: {
      ...(payload.marks !== undefined ? { marks: payload.marks, grade: newGrade } : {}),
      ...(payload.published !== undefined
        ? {
            published: payload.published,
            publishedAt: payload.published ? new Date() : null,
          }
        : {}),
    },
    include: resultInclude,
  });

  if (payload.published && !existing.published) {
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PUBLISH_RESULT,
      resource: 'Result',
      resourceId: updated.id,
      details: {
        enrollmentId: updated.enrollmentId,
        marks: updated.marks,
        grade: updated.grade,
      },
    });
  }

  return updated;
};

const publishResultsIntoDB = async (
  payload: PublishResultInput,
  user: { id: string; role: Role },
) => {
  const whereCondition: Prisma.ResultWhereInput = {
    id: { in: payload.resultIds },
    ...(user.role === Role.TEACHER ? { teacherId: user.id } : {}),
  };

  const results = await prisma.result.findMany({ where: whereCondition });
  if (results.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No matching results found to publish');
  }

  await prisma.result.updateMany({
    where: whereCondition,
    data: { published: true, publishedAt: new Date() },
  });

  for (const res of results) {
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PUBLISH_RESULT,
      resource: 'Result',
      resourceId: res.id,
      details: { marks: res.marks, grade: res.grade },
    });
  }

  return { message: `${results.length} result(s) published successfully` };
};

const getMyResultsFromDB = async (studentId: string) => {
  return await prisma.result.findMany({
    where: {
      enrollment: { studentId },
      published: true,
    },
    include: resultInclude,
    orderBy: { createdAt: 'desc' },
  });
};

const getOfferingResultsFromDB = async (offeringId: string, user: { id: string; role: Role }) => {
  const offering = await prisma.courseOffering.findFirst({
    where: { id: offeringId, deletedAt: null },
  });

  if (!offering) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course offering not found');
  }

  if (user.role === Role.TEACHER && offering.teacherId !== user.id) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only view results for your assigned courses');
  }

  return await prisma.result.findMany({
    where: { enrollment: { courseOfferingId: offeringId } },
    include: resultInclude,
    orderBy: { createdAt: 'desc' },
  });
};

const getAllResultsFromDB = async (query: {
  page?: number;
  limit?: number;
  published?: boolean;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const whereCondition: Prisma.ResultWhereInput = {
    ...(query.published !== undefined ? { published: query.published } : {}),
  };

  const [total, results] = await Promise.all([
    prisma.result.count({ where: whereCondition }),
    prisma.result.findMany({
      where: whereCondition,
      include: resultInclude,
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
    data: results,
  };
};

const getResultByIdFromDB = async (id: string, user: { id: string; role: Role }) => {
  const result = await prisma.result.findUnique({
    where: { id },
    include: resultInclude,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Result not found');
  }

  if (user.role === Role.STUDENT) {
    if (result.enrollment.studentId !== user.id || !result.published) {
      throw new AppError(httpStatus.FORBIDDEN, 'You cannot access this result');
    }
  }

  if (user.role === Role.TEACHER && result.teacherId !== user.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You cannot access results for other teachers courses',
    );
  }

  return result;
};

export const resultService = {
  submitResultIntoDB,
  updateResultIntoDB,
  publishResultsIntoDB,
  getMyResultsFromDB,
  getOfferingResultsFromDB,
  getAllResultsFromDB,
  getResultByIdFromDB,
};
