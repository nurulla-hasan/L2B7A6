import { Router } from 'express';
import { Role } from '../../../generated/prisma/client';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { semesterController } from './semester.controller';
import { createSemesterSchema, updateSemesterSchema } from './semester.validation';

export const semesterRouter = Router();

semesterRouter.post(
  '/',
  auth(Role.ADMIN),
  validate(createSemesterSchema),
  semesterController.createSemester,
);

semesterRouter.get('/', auth(), semesterController.getAllSemesters);

semesterRouter.get('/:id', auth(), semesterController.getSemesterById);

semesterRouter.patch(
  '/:id',
  auth(Role.ADMIN),
  validate(updateSemesterSchema),
  semesterController.updateSemester,
);

semesterRouter.delete('/:id', auth(Role.ADMIN), semesterController.softDeleteSemester);
