import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { resultController } from './result.controller';
import {
  publishResultSchema,
  submitResultSchema,
  updateResultSchema,
} from './result.validation';

export const resultRouter = Router();

// Student views their own published results
resultRouter.get('/my', auth('STUDENT'), resultController.getMyResults);

// Teacher or Admin bulk publishes results
resultRouter.patch(
  '/publish',
  auth('TEACHER', 'ADMIN'),
  validate(publishResultSchema),
  resultController.publishResults,
);

// Teacher or Admin views results for a specific course offering
resultRouter.get(
  '/offering/:id',
  auth('TEACHER', 'ADMIN'),
  resultController.getOfferingResults,
);

// Teacher submits marks for an enrolled student
resultRouter.post(
  '/',
  auth('TEACHER'),
  validate(submitResultSchema),
  resultController.submitResult,
);

// Admin views all results
resultRouter.get('/', auth('ADMIN'), resultController.getAllResults);

// Authenticated user views a single result by ID
resultRouter.get(
  '/:id',
  auth('ADMIN', 'TEACHER', 'STUDENT'),
  resultController.getResultById,
);

// Teacher or Admin updates result marks or publish status
resultRouter.patch(
  '/:id',
  auth('TEACHER', 'ADMIN'),
  validate(updateResultSchema),
  resultController.updateResult,
);

