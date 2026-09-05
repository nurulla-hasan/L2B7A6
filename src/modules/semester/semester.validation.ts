import { z } from 'zod';

const isValidDate = (val: string) => !Number.isNaN(Date.parse(val));

export const createSemesterSchema = z
  .object({
    name: z
      .string({
        error: 'Semester name is required',
      })
      .min(2, 'Semester name must be at least 2 characters'),
    year: z
      .number({
        error: 'Year must be a number',
      })
      .int()
      .min(2020)
      .max(2099),
    startDate: z
      .string({
        error: 'Start date is required',
      })
      .refine(isValidDate, {
        message: 'Start date must be a valid date (e.g. 2026-09-01)',
      }),
    endDate: z
      .string({
        error: 'End date is required',
      })
      .refine(isValidDate, {
        message: 'End date must be a valid date (e.g. 2026-12-31)',
      }),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateSemesterSchema = z
  .object({
    name: z.string().min(2).optional(),
    year: z.number().int().min(2020).max(2099).optional(),
    startDate: z
      .string()
      .refine(isValidDate, {
        message: 'Start date must be a valid date (e.g. 2026-09-01)',
      })
      .optional(),
    endDate: z
      .string()
      .refine(isValidDate, {
        message: 'End date must be a valid date (e.g. 2026-12-31)',
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
export type UpdateSemesterInput = z.infer<typeof updateSemesterSchema>;

export interface GetSemestersQueryInput {
  page?: number;
  limit?: number;
  searchTerm?: string;
  year?: number;
  sortBy?: 'newest' | 'oldest' | 'year_asc' | 'year_desc';
}
