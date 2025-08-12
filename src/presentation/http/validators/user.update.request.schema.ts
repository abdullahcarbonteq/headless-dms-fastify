import { z } from 'zod';

export const updateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

