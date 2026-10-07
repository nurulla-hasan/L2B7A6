import { z } from 'zod';

export const submitResultSchema = z.object({
  enrollmentId: z
    .string({
      error: 'Enrollment ID is required',
    })
    .uuid('Enrollment ID must be a valid UUID'),
  marks: z.coerce
    .number({
      error: 'Marks must be a number',
    })
    .min(0, 'Marks cannot be less than 0')
    .max(100, 'Marks cannot exceed 100'),
  published: z.boolean().optional().default(false),
});

export const updateResultSchema = z.object({
  marks: z.coerce
    .number({
      error: 'Marks must be a number',
    })
    .min(0, 'Marks cannot be less than 0')
    .max(100, 'Marks cannot exceed 100')
    .optional(),
  published: z.boolean().optional(),
});

export const publishResultSchema = z
  .object({
    resultIds: z.array(z.string().uuid('Each result ID must be a valid UUID')).optional(),
    publishAll: z.boolean().optional(),
  })
  .refine(
    (data) =>
      (data.resultIds !== undefined && data.resultIds.length > 0) || data.publishAll === true,
    {
      message: 'Either provide resultIds or set publishAll to true',
    },
  );

export type SubmitResultInput = z.infer<typeof submitResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
export type PublishResultInput = z.infer<typeof publishResultSchema>;
