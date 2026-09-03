import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { userController } from './user.controller';
import { createAdminSchema, updateUserRoleSchema, updateUserStatusSchema } from './user.validation';

export const userRouter = Router();

// Upload current user profile image
userRouter.patch(
  '/profile-image',
  auth(),
  upload.single('image'),
  userController.uploadProfileImage,
);

// Get all users (Admin & Super Admin)
userRouter.get('/', auth('ADMIN'), userController.getAllUsers);

// Get user by ID (Admin & Super Admin)
userRouter.get('/:id', auth('ADMIN'), userController.getUserById);

// Create new Admin (Super Admin only)
userRouter.post(
  '/create-admin',
  auth('ADMIN'),
  validate(createAdminSchema),
  userController.createAdmin,
);

// Update user status (Admin & Super Admin)
userRouter.patch(
  '/:id/status',
  auth('ADMIN'),
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

// Update user role (Super Admin only)
userRouter.patch(
  '/:id/role',
  auth('ADMIN'),
  validate(updateUserRoleSchema),
  userController.updateUserRole,
);

// Delete user (Super Admin only)
userRouter.delete('/:id', auth('ADMIN'), userController.deleteUser);
