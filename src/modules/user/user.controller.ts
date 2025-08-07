import { FastifyReply, FastifyRequest } from 'fastify';
import { registerSchema } from './user.register.dto.js';
import { loginSchema } from './user.login.dto.js';
import { updateUserSchema, getUserByIdSchema } from './user.update.dto.js';
import { UserService } from './user.service.js';
import { Result } from '@carbonteq/fp';
import { container } from '../../config/container.js';
import { IAuthService } from '../../shared/interfaces/IAuthService.js';

// Get service instances from DI container
const userService = container.resolve(UserService);
const authService = container.resolve<IAuthService>('IAuthService');

export const UserController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    
    const result = await userService.register(parsed.data);
    
    if (result.isOk()) {
      return reply.status(201).send({ message: 'User registered', user: result.unwrap() });
    } else {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    
    const result = await userService.login(parsed.data);
    
    if (result.isOk()) {
      const user = result.unwrap();
      
      // Generate JWT using injected auth service
      const tokenResult = await authService.generateToken(user);
      if (tokenResult.isErr()) {
        return reply.status(500).send({ error: 'Failed to generate authentication token' });
      }
      
      const token = tokenResult.unwrap();
      return reply.send({ message: 'Login successful', token });
    } else {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }
  },

  async getAllUsers(req: FastifyRequest, reply: FastifyReply) {
    const result = await userService.getAllUsers();
    
    if (result.isOk()) {
      return reply.send({ 
        success: true,
        users: result.unwrap() 
      });
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async getUserById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    const parsed = getUserByIdSchema.safeParse({ id });
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid user ID format' });
    }
    
    const result = await userService.findById(parsed.data.id);
    
    if (result.isOk()) {
      const user = result.unwrap();
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return reply.send({ 
        success: true,
        user 
      });
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async updateUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    
    const result = await userService.updateUser(id, parsed.data);
    
    if (result.isOk()) {
      return reply.send({ 
        success: true,
        message: 'User updated successfully',
        user: result.unwrap() 
      });
    } else {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }
  },

  async deleteUser(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    const parsed = getUserByIdSchema.safeParse({ id });
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid user ID format' });
    }
    
    // Get requesting user ID from JWT token
    const requestingUserId = (req.user as any)?.userId;
    if (!requestingUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    
    const result = await userService.deleteUser(parsed.data.id, requestingUserId);
    
    if (result.isOk()) {
      const deleted = result.unwrap();
      if (deleted) {
        return reply.send({ 
          success: true,
          message: 'User deleted successfully' 
        });
      } else {
        return reply.status(404).send({ error: 'User not found' });
      }
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  }
};
