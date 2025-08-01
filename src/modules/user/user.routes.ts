import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller.js';
import { verifyJWT, requireAdmin } from '../../middlewares/auth.js';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', UserController.register);
  app.post('/login', UserController.login);
  
  // Admin-only routes - specific routes first
  app.get('/all', { preHandler: [requireAdmin] }, UserController.getAllUsers);
  app.get('/protected', { preHandler: [requireAdmin] }, async (req, reply) => {
    return reply.send({ message: 'You are authenticated as admin!', user: req.user });
  });
  
  // Parameterized routes last
  app.get('/:id', { preHandler: [requireAdmin] }, UserController.getUserById);
  app.put('/:id', { preHandler: [requireAdmin] }, UserController.updateUser);
  app.delete('/:id', { preHandler: [requireAdmin] }, UserController.deleteUser);
}
