import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(6),
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
