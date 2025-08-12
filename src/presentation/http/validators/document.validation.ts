import { z } from 'zod';
import { paginationQuerySchema } from '../../../shared/dto/pagination.dto.js';

export const updateMetadataSchema = z.object({
  tags: z.array(z.string().min(1)).max(10).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const searchQuerySchema = paginationQuerySchema.extend({
  tags: z.string().optional(),
  description: z.string().optional(),
});

