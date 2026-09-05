import { z } from 'zod';

export const createCourseValidationSchema = z.object({
  title: z
    .string({
      error: 'Course title is required',
    })
    .min(2, 'Course title must be at least 2 characters')
    .trim(),
  code: z
    .string({
      error: 'Course code is required',
    })
    .min(2, 'Course code must be at least 2 characters')
    .trim()
    .toUpperCase(),
  credits: z.coerce
    .number({
      error: 'Credits must be a number',
    })
    .positive('Credits must be greater than 0')
    .max(30, 'Credits cannot exceed 30'),
});

export const updateCourseValidationSchema = z.object({
  title: z.string().min(2, 'Course title must be at least 2 characters').trim().optional(),
  code: z
    .string()
    .min(2, 'Course code must be at least 2 characters')
    .trim()
    .toUpperCase()
    .optional(),
  credits: z.coerce
    .number()
    .positive('Credits must be greater than 0')
    .max(30, 'Credits cannot exceed 30')
    .optional(),
});
