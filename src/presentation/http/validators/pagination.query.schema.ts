import { z } from 'zod';

/**
 * Pagination query parameters schema for HTTP requests
 * Maps to hexapp PaginationOptions internally
 */
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).refine((val) => val > 0, {
    message: 'Page must be a valid positive integer'
  }).optional(),
  limit: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).refine((val) => val > 0 && val <= 100, {
    message: 'Limit must be a valid positive integer between 1 and 100'
  }).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>; 