import { z } from 'zod';
import { paginationQuerySchema } from './pagination.query.schema.js';

export const searchDocumentsRequestSchema = paginationQuerySchema.extend({
  tags: z.string().optional(),
  description: z.string().optional(),
});

