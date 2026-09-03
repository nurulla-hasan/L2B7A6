import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { AuthProvider, type Prisma, type Role } from '../../../generated/prisma/client';
import { deleteFromCloudinary, uploadToCloudinary } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import type {
  CreateAdminInput,
  GetUsersQueryInput,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from './user.validation';

const getAllUsersFromDB = async (query: GetUsersQueryInput, currentUserId?: string) => {
  const { page, limit, searchTerm, role, status, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (currentUserId) {
    andConditions.push({ id: { not: currentUserId } });
  }

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereCondition: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderByMap: Record<string, Prisma.UserOrderByWithRelationInput[]> = {
    newest: [{ createdAt: 'desc' }],
    oldest: [{ createdAt: 'asc' }],
    name_asc: [{ name: 'asc' }],
    name_desc: [{ name: 'desc' }],
  };

  const orderBy = orderByMap[sortBy] || [{ createdAt: 'desc' }];

  const [total, rawUsers] = await Promise.all([
    prisma.user.count({ where: whereCondition }),
    prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        imageUrl: true,
        emailVerified: true,
        createdAt: true,
        teacherProfile: true,
        studentProfile: true,
      },
    }),
  ]);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: rawUsers,
  };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      imageUrl: true,
      emailVerified: true,
      createdAt: true,
      teacherProfile: true,
      studentProfile: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const createAdminIntoDB = async (payload: CreateAdminInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const adminUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: passwordHash,
      phone: payload.phone ?? '',
      role: payload.role as Role,
      status: 'ACTIVE',
      emailVerified: true,
      authProvider: AuthProvider.CREDENTIAL,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
    },
  });

  return adminUser;
};

const updateUserStatusIntoDB = async (
  id: string,
  payload: UpdateUserStatusInput,
  currentUserId: string,
) => {
  if (id === currentUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot change your own status');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status: payload.status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

const updateUserRoleIntoDB = async (
  id: string,
  payload: UpdateUserRoleInput,
  currentUserId: string,
) => {
  if (id === currentUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot change your own role');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: payload.role as Role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

const deleteUserFromDB = async (id: string, currentUserId: string) => {
  if (id === currentUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.imagePublicId) {
    await deleteFromCloudinary(user.imagePublicId);
  }

  await prisma.user.delete({ where: { id } });
  return { message: 'User deleted successfully' };
};

const uploadProfileImageIntoDB = async (userId: string, file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image file');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { imagePublicId: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.imagePublicId) {
    await deleteFromCloudinary(user.imagePublicId);
  }

  const result = await uploadToCloudinary(file.buffer);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  return updatedUser;
};

export const userService = {
  getAllUsersFromDB,
  getUserByIdFromDB,
  createAdminIntoDB,
  updateUserStatusIntoDB,
  updateUserRoleIntoDB,
  deleteUserFromDB,
  uploadProfileImageIntoDB,
};
