import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { enrollmentController } from './enrollment.controller';
import {
  createEnrollmentSchema,
  updateEnrollmentStatusSchema,
} from './enrollment.validation';

export const enrollmentRouter = Router();

// Student enrolls in a course offering
enrollmentRouter.post(
  '/',
  auth('STUDENT'),
  validate(createEnrollmentSchema),
  enrollmentController.enrollStudent,
);

// Student views their own enrollments
enrollmentRouter.get('/my', auth('STUDENT'), enrollmentController.getMyEnrollments);

// Teacher or Admin views enrollments for a specific course offering
enrollmentRouter.get(
  '/offering/:id',
  auth('TEACHER', 'ADMIN'),
  enrollmentController.getOfferingEnrollments,
);

// Admin views all enrollments (with filters & pagination)
enrollmentRouter.get('/', auth('ADMIN'), enrollmentController.getAllEnrollments);

// Authenticated user views a single enrollment by ID
enrollmentRouter.get(
  '/:id',
  auth('ADMIN', 'TEACHER', 'STUDENT'),
  enrollmentController.getEnrollmentById,
);

// Student drops their own enrollment
enrollmentRouter.patch('/:id/drop', auth('STUDENT'), enrollmentController.dropEnrollment);

// Admin manually updates enrollment status
enrollmentRouter.patch(
  '/:id/status',
  auth('ADMIN'),
  validate(updateEnrollmentStatusSchema),
  enrollmentController.updateEnrollmentStatus,
);

