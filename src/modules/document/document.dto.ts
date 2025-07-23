import { z } from 'zod';

export const uploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  path: z.string().min(1),
});

export type UploadDTO = z.infer<typeof uploadSchema>;
