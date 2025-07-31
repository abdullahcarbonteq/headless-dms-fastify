import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller.js';
import { verifyJWT, requireAdmin } from '../../middlewares/auth.js';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', UserController.register);
  app.post('/login', UserController.login);
  app.get('/protected', { preHandler: [requireAdmin] }, async (req, reply) => {
    return reply.send({ message: 'You are authenticated as admin!', user: req.user });
  });
}
