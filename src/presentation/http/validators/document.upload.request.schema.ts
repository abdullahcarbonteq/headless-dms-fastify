import { z } from 'zod';

// Schema for metadata fields transmitted alongside multipart upload
// Files themselves are handled by fastify-multipart; we validate just fields here.
export const uploadDocumentFieldsSchema = z.object({
  // Clients may send tags as a JSON array string or comma-separated string.
  // We first accept a raw string, then parse it in controller; here we ensure max length and characters are reasonable if present
  tags: z
    .string()
    .max(1000)
    .optional(),

  // Optional free-text description
  description: z
    .string()
    .max(1000)
    .optional(),
});

export type UploadDocumentFields = z.infer<typeof uploadDocumentFieldsSchema>;

