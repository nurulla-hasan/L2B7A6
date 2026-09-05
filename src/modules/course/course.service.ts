import type { UploadApiResponse } from 'cloudinary';
import httpStatus from 'http-status';
import type { Prisma } from '../../../generated/prisma/client';
import { cloudinary } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { createAuditLog } from '../audit/audit.service';
import type { ICreateCoursePayload, IUpdateCoursePayload } from './course.interface';

const createCourseIntoDB = async (
  payload: ICreateCoursePayload,
  files?: Express.Multer.File[],
  userId?: string,
) => {
  const isCourseExists = await prisma.course.findFirst({
    where: {
      code: payload.code,
      deletedAt: null,
    },
  });

  if (isCourseExists) {
    throw new AppError(httpStatus.CONFLICT, 'Course with this code already exists');
  }

  // Upload multiple images to Cloudinary (PH Healthcare style)
  let imagesUrls: string[] = [];
  if (files && files.length > 0) {
    const uploadResults = await Promise.all(
      files.map((file) => {
        return new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'ums/courses',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('No result returned from Cloudinary'));
                resolve(result);
              },
            )
            .end(file.buffer);
        });
      }),
    );
    imagesUrls = uploadResults.map((res) => res.secure_url);
  }

  const course = await prisma.course.create({
    data: {
      title: payload.title,
      code: payload.code,
      credits: payload.credits,
      images: imagesUrls,
    },
  });

  // Audit log entry
  await createAuditLog({
    userId,
    action: 'CREATE_COURSE',
    resource: 'Course',
    resourceId: course.id,
    details: {
      title: course.title,
      code: course.code,
      credits: course.credits,
      imagesCount: course.images.length,
    },
  });

  return course;
};

const getAllCoursesFromDB = async (query: {
  page?: number;
  limit?: number;
  searchTerm?: string;
}) => {
  const pageNum = Math.max(1, query.page || 1);
  const limitNum = Math.max(1, query.limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.CourseWhereInput[] = [{ deletedAt: null }];

  if (query.searchTerm?.trim()) {
    const term = query.searchTerm.trim();
    andConditions.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  const whereCondition: Prisma.CourseWhereInput = { AND: andConditions };

  const [total, courses] = await Promise.all([
    prisma.course.count({ where: whereCondition }),
    prisma.course.findMany({
      where: whereCondition,
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
    data: courses,
  };
};

const getCourseByIdFromDB = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: {
      courseOfferings: {
        where: { deletedAt: null },
        include: {
          semester: {
            select: { id: true, name: true, year: true, startDate: true, endDate: true },
          },
          teacher: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, 'Course not found');
  }

  return course;
};

const updateCourseIntoDB = async (
  id: string,
  payload: IUpdateCoursePayload,
  files?: Express.Multer.File[],
) => {
  const existingCourse = await getCourseByIdFromDB(id);

  if (payload.code) {
    const duplicate = await prisma.course.findFirst({
      where: {
        code: payload.code,
        id: { not: id },
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw new AppError(httpStatus.CONFLICT, 'Another course with this code already exists');
    }
  }

  let imagesUrls: string[] = existingCourse.images;
  if (files && files.length > 0) {
    const uploadResults = await Promise.all(
      files.map((file) => {
        return new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: 'ums/courses',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error('No result returned from Cloudinary'));
                resolve(result);
              },
            )
            .end(file.buffer);
        });
      }),
    );
    const newUrls = uploadResults.map((res) => res.secure_url);
    imagesUrls = Array.from(new Set([...imagesUrls, ...newUrls]));
  }

  return await prisma.course.update({
    where: { id },
    data: {
      ...payload,
      images: imagesUrls,
    },
  });
};

const deleteCourseFromDB = async (id: string) => {
  await getCourseByIdFromDB(id);

  await prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Course deleted successfully' };
};

export const courseService = {
  createCourseIntoDB,
  getAllCoursesFromDB,
  getCourseByIdFromDB,
  updateCourseIntoDB,
  deleteCourseFromDB,
};
