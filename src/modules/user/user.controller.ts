import { FastifyReply, FastifyRequest } from 'fastify';
import { registerSchema } from './dto/register.dto.js';
import { loginSchema } from './dto/login.dto.js';
import { UserService } from './user.service.js';
import { Result } from '@carbonteq/fp';
import { container } from '../../config/container.js';

// Get service instance from DI container
const userService = container.resolve(UserService);

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
      // Generate JWT
      const token = await reply.server.jwt.sign({
        userId: result.unwrap().id,
        role: result.unwrap().role,
        email: result.unwrap().email
      });
      // Return token (and optionally user info)
      return reply.send({ message: 'Login successful', token });
    } else {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }
  }
};
