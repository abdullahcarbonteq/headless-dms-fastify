import { z } from 'zod';

// Schema for updating user information
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

// Type for updating user information
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;

// Schema for getting user by ID
export const getUserByIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Type for getting user by ID
export type GetUserByIdDTO = z.infer<typeof getUserByIdSchema>; 