import { z } from 'zod';

export const createCourseOfferingSchema = z.object({
  courseId: z
    .string({
      error: 'Course ID is required',
    })
    .uuid('Course ID must be a valid UUID'),
  semesterId: z
    .string({
      error: 'Semester ID is required',
    })
    .uuid('Semester ID must be a valid UUID'),
  teacherId: z
    .string({
      error: 'Teacher ID is required',
    })
    .uuid('Teacher ID must be a valid UUID'),
  section: z
    .string({
      error: 'Section is required',
    })
    .min(1, 'Section cannot be empty')
    .max(10, 'Section name cannot exceed 10 characters')
    .trim()
    .toUpperCase(),
  capacity: z.coerce
    .number({
      error: 'Capacity must be a number',
    })
    .int('Capacity must be an integer')
    .positive('Capacity must be greater than 0')
    .max(500, 'Capacity cannot exceed 500'),
  fee: z.coerce
    .number({
      error: 'Fee must be a number',
    })
    .int('Fee must be an integer')
    .nonnegative('Fee cannot be negative')
    .max(1000000, 'Fee cannot exceed 1,000,000 BDT'),
});

export const updateCourseOfferingSchema = z.object({
  teacherId: z.string().uuid('Teacher ID must be a valid UUID').optional(),
  section: z.string().min(1).max(10).trim().toUpperCase().optional(),
  capacity: z.coerce.number().int().positive().max(500).optional(),
  fee: z.coerce.number().int().nonnegative().max(1000000).optional(),
});

export type CreateCourseOfferingInput = z.infer<typeof createCourseOfferingSchema>;
export type UpdateCourseOfferingInput = z.infer<typeof updateCourseOfferingSchema>;
