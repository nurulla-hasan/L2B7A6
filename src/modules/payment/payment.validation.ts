import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  enrollmentId: z
    .string({
      error: 'Enrollment ID is required',
    })
    .uuid('Enrollment ID must be a valid UUID'),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

