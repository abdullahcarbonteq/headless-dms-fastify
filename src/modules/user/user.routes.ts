import { FastifyInstance } from 'fastify';
import { UserController, UserValidation } from './user.controller.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { verifyJWT } from '../../middlewares/auth.js';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', { preHandler: UserValidation.register }, UserController.register);
  app.post('/login', { preHandler: UserValidation.login }, UserController.login);
  
  app.get('/all', { preHandler: [requireAdmin, UserValidation.getAll] }, UserController.getAllUsers);
  app.put('/:id', { preHandler: [requireAdmin, UserValidation.updateUser] }, UserController.updateUser);
  app.delete('/:id', { preHandler: [requireAdmin, UserValidation.deleteUser] }, UserController.deleteUser);
}
