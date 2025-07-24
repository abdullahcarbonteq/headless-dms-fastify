import { z } from 'zod';

export const uploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  path: z.string().min(1),
  tags: z.string().optional(),
  description: z.string().optional(),
});

export type InsertDocumentDTO = z.infer<typeof uploadSchema>;
