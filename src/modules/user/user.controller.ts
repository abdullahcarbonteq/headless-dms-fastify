import { FastifyReply, FastifyRequest } from 'fastify';
import { registerSchema } from './user.register.dto.js';
import { loginSchema } from './user.login.dto.js';
import { updateUserSchema, getUserByIdSchema } from './user.update.dto.js';
import { UserService } from './user.service.js';
import { container } from '../../config/container.js';
import { IAuthService } from '../../shared/interfaces/IAuthService.js';
import { ResponseHandler } from '../../shared/utils/ResponseHandler.js';
import { ValidationMiddleware } from '../../shared/middlewares/validation.js';
import { z } from 'zod';
import { paginationQuerySchema } from '../../shared/dto/pagination.dto.js';
import { Result } from '@carbonteq/fp';

// Get service instances from DI container
const userService = container.resolve(UserService);
const authService = container.resolve<IAuthService>('IAuthService');

const userIdSchema = z.object({
  id: z.string().uuid()
});

export const UserController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const result = await userService.register(req.body as any);
    return ResponseHandler.success(reply, result, 201, 'User registered successfully');
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const result = await userService.login(req.body as any);
    
    if (result.isErr()) {
      return ResponseHandler.error(reply, result.unwrapErr(), 400);
    }

    const user = result.unwrap();
    
    // Generate JWT using injected auth service
    const tokenResult = await authService.generateToken(user);
    if (tokenResult.isErr()) {
      return ResponseHandler.error(reply, new Error('Failed to generate authentication token'), 500);
    }
    
    const token = tokenResult.unwrap();
    return ResponseHandler.success(reply, Result.Ok({ token }), 200, 'Login successful');
  },

  async getAllUsers(req: FastifyRequest, reply: FastifyReply) {
    const { page, limit } = (req.query as any) || {};
    const result = await userService.getAllUsers({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
    return ResponseHandler.paginated(reply, result);
  },

  async getUserById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await userService.findById(id);
    return ResponseHandler.optional(reply, result, 'User not found');
  },

  async updateUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await userService.updateUser(id, req.body as any);
    return ResponseHandler.success(reply, result, 200, 'User updated successfully');
  },

  async deleteUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    // Get requesting user ID from JWT token
    const requestingUserId = (req.user as any)?.userId;
    if (!requestingUserId) {
      return ResponseHandler.error(reply, new Error('Unauthorized'), 401);
    }
    
    const result = await userService.deleteUser(id, requestingUserId);
    return ResponseHandler.boolean(
      reply, 
      result, 
      'User deleted successfully', 
      'User not found'
    );
  }
};

// Export validation middleware for routes
export const UserValidation = {
  register: ValidationMiddleware.body(registerSchema),
  login: ValidationMiddleware.body(loginSchema),
  getAll: ValidationMiddleware.query(paginationQuerySchema),
  getUserById: ValidationMiddleware.params(userIdSchema),
  updateUser: ValidationMiddleware.all({
    params: userIdSchema,
    body: updateUserSchema
  }),
  deleteUser: ValidationMiddleware.params(userIdSchema)
};
