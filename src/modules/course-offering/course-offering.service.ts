import httpStatus from 'http-status';
import { AuditAction, type Prisma, Role, UserStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import type {
  CreateCourseOfferingInput,
  UpdateCourseOfferingInput,
} from './course-offering.validation';

const createCourseOfferingIntoDB = async (payload: CreateCourseOfferingInput, adminId?: string) => {
  // 1. Verify Course exists & is not soft-deleted
  const course = await prisma.course.findFirst({
    where: { id: payload.courseId, deletedAt: null },
  });
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  // 2. Verify Semester exists & is not soft-deleted
  const semester = await prisma.semester.findFirst({
    where: { id: payload.semesterId, deletedAt: null },
  });
  if (!semester) {
    throw new AppError(httpStatus.NOT_FOUND, 'Semester not found');
  }

  // 3. Verify Teacher exists, is ACTIVE and has TEACHER role
  const teacher = await prisma.user.findFirst({
    where: {
      id: payload.teacherId,
      role: Role.TEACHER,
      status: UserStatus.ACTIVE,
    },
  });
  if (!teacher) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Assigned user must be an active teacher');
  }

  // 4. Guardrail: duplicate offering (same course, semester, section)
  const existingSection = await prisma.courseOffering.findFirst({
    where: {
      courseId: payload.courseId,
      semesterId: payload.semesterId,
      section: payload.section,
      deletedAt: null,
    },
  });
  if (existingSection) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Section '${payload.section}' already exists for this course in the semester`,
    );
  }

  // 5. Create Course Offering
  const courseOffering = await prisma.courseOffering.create({
    data: {
      courseId: payload.courseId,
      semesterId: payload.semesterId,
      teacherId: payload.teacherId,
      section: payload.section,
      capacity: payload.capacity,
      fee: payload.fee,
    },
    include: {
      course: true,
      semester: true,
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // 6. Audit Log
  await createAuditLog({
    userId: adminId,
    action: AuditAction.CREATE_COURSE_OFFERING,
    resource: 'CourseOffering',
    resourceId: courseOffering.id,
    details: {
      courseCode: course.code,
      semesterName: semester.name,
      section: courseOffering.section,
      capacity: courseOffering.capacity,
      fee: courseOffering.fee,
      teacherName: teacher.name,
    },
  });

  return courseOffering;
};

const getAllCourseOfferingsFromDB = async (query: {
  page?: number;
  limit?: number;
  semesterId?: string;
  courseId?: string;
  teacherId?: string;
  section?: string;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.CourseOfferingWhereInput[] = [{ deletedAt: null }];

  if (query.semesterId) {
    andConditions.push({ semesterId: query.semesterId });
  }

  if (query.courseId) {
    andConditions.push({ courseId: query.courseId });
  }

  if (query.teacherId) {
    andConditions.push({ teacherId: query.teacherId });
  }

  if (query.section?.trim()) {
    andConditions.push({ section: { equals: query.section.trim(), mode: 'insensitive' } });
  }

  const whereCondition: Prisma.CourseOfferingWhereInput = { AND: andConditions };

  const [total, offerings] = await Promise.all([
    prisma.courseOffering.count({ where: whereCondition }),
    prisma.courseOffering.findMany({
      where: whereCondition,
      include: {
        course: { select: { id: true, title: true, code: true, credits: true } },
        semester: { select: { id: true, name: true, year: true, startDate: true, endDate: true } },
        teacher: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ENROLLED' },
            },
          },
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
    data: offerings,
  };
};

const getCourseOfferingByIdFromDB = async (id: string) => {
  const offering = await prisma.courseOffering.findFirst({
    where: { id, deletedAt: null },
    include: {
      course: true,
      semester: true,
      teacher: { select: { id: true, name: true, email: true, phone: true } },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!offering) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course offering not found');
  }

  return offering;
};

const updateCourseOfferingIntoDB = async (id: string, payload: UpdateCourseOfferingInput) => {
  const existing = await getCourseOfferingByIdFromDB(id);

  if (payload.teacherId) {
    const teacher = await prisma.user.findFirst({
      where: {
        id: payload.teacherId,
        role: Role.TEACHER,
        status: UserStatus.ACTIVE,
      },
    });
    if (!teacher) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Assigned user must be an active teacher');
    }
  }

  if (payload.section && payload.section !== existing.section) {
    const duplicate = await prisma.courseOffering.findFirst({
      where: {
        courseId: existing.courseId,
        semesterId: existing.semesterId,
        section: payload.section,
        id: { not: id },
        deletedAt: null,
      },
    });
    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        `Section '${payload.section}' already exists for this course in the semester`,
      );
    }
  }

  return await prisma.courseOffering.update({
    where: { id },
    data: payload,
    include: {
      course: true,
      semester: true,
      teacher: { select: { id: true, name: true, email: true } },
    },
  });
};

const deleteCourseOfferingFromDB = async (id: string) => {
  await getCourseOfferingByIdFromDB(id);

  await prisma.courseOffering.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Course offering deleted successfully' };
};

export const courseOfferingService = {
  createCourseOfferingIntoDB,
  getAllCourseOfferingsFromDB,
  getCourseOfferingByIdFromDB,
  updateCourseOfferingIntoDB,
  deleteCourseOfferingFromDB,
};
