import { z } from 'zod';

export const uploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  path: z.string().min(1),
  tags: z.string().optional(), // Will be parsed as JSON string in service
  description: z.string().optional(),
  userId: z.string().min(1),
});

export type InsertDocumentDTO = z.infer<typeof uploadSchema>;
