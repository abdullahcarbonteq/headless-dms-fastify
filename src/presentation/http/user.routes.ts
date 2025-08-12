import { FastifyInstance } from 'fastify';
import { UserHttpController, UserHttpValidation } from './user.controller.js';
import { requireAdmin, verifyJWT } from './middlewares/auth.js';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', { preHandler: UserHttpValidation.register }, UserHttpController.register);
  app.post('/login', { preHandler: UserHttpValidation.login }, UserHttpController.login);
  app.get('/all', { preHandler: [requireAdmin, UserHttpValidation.getAll] }, UserHttpController.getAll);
  app.put('/:id', { preHandler: [requireAdmin, UserHttpValidation.update] }, UserHttpController.update);
  app.delete('/:id', { preHandler: [requireAdmin, UserHttpValidation.delete] }, UserHttpController.delete);
}

