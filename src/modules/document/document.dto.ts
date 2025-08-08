import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/dto/pagination.dto.js';

export const uploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  path: z.string().min(1),
  tags: z.string().optional(), // Will be parsed as JSON string in service
  description: z.string().optional(),
  userId: z.string().min(1),
});

export type InsertDocumentDTO = z.infer<typeof uploadSchema>;

// Search query schema for documents (with pagination)
export const searchQuerySchema = paginationQuerySchema.extend({
  tags: z.string().optional(), // comma-separated list or JSON string (parsed in controller/service)
  description: z.string().optional(),
});

export type DocumentSearchQueryDTO = z.infer<typeof searchQuerySchema>;

// Update metadata schema (tags and description)
export const updateMetadataSchema = z.object({
  tags: z.array(z.string().min(1)).max(10).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type UpdateMetadataDTO = z.infer<typeof updateMetadataSchema>;
