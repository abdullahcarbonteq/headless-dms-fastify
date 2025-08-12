import { z } from 'zod';

export const updateDocumentMetadataRequestSchema = z.object({
  tags: z.array(z.string().min(1)).max(10).optional(),
  description: z.string().max(1000).nullable().optional(),
});

