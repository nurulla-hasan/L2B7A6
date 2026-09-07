import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { courseOfferingController } from './course-offering.controller';
import {
  createCourseOfferingSchema,
  updateCourseOfferingSchema,
} from './course-offering.validation';

export const courseOfferingRouter = Router();

// Create new course offering (Admin only)
courseOfferingRouter.post(
  '/',
  auth('ADMIN'),
  validate(createCourseOfferingSchema),
  courseOfferingController.createCourseOffering,
);

// Get all course offerings (Authenticated)
courseOfferingRouter.get('/', auth(), courseOfferingController.getAllCourseOfferings);

// Get single course offering by ID (Authenticated)
courseOfferingRouter.get('/:id', auth(), courseOfferingController.getCourseOfferingById);

// Update course offering (Admin only)
courseOfferingRouter.patch(
  '/:id',
  auth('ADMIN'),
  validate(updateCourseOfferingSchema),
  courseOfferingController.updateCourseOffering,
);

// Soft delete course offering (Admin only)
courseOfferingRouter.delete('/:id', auth('ADMIN'), courseOfferingController.deleteCourseOffering);
