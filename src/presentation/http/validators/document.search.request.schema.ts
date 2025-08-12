import { z } from 'zod';
import { paginationQuerySchema } from '../../../shared/dto/pagination.dto.js';

export const searchDocumentsRequestSchema = paginationQuerySchema.extend({
  tags: z.string().optional(),
  description: z.string().optional(),
});

