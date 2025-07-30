import { z } from 'zod';

// Pagination query parameters schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// Standard pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Standard paginated result
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Standard API response for paginated data
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
