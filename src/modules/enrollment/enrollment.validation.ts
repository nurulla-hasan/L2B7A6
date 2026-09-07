import { z } from 'zod';
import { EnrollmentStatus } from '../../../generated/prisma/client';

export const createEnrollmentSchema = z.object({
  courseOfferingId: z
    .string({
      error: 'Course offering ID is required',
    })
    .uuid('Course offering ID must be a valid UUID'),
});

export const updateEnrollmentStatusSchema = z.object({
  status: z.nativeEnum(EnrollmentStatus, {
    error: 'Enrollment status must be PENDING_PAYMENT, ENROLLED, or DROPPED',
  }),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;

