import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { verifyJWT, requireAdmin } from '../../utils/middlewares/auth';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', UserController.register);
  app.post('/login', UserController.login);
  app.get('/protected', { preHandler: [requireAdmin] }, async (req, reply) => {
    return reply.send({ message: 'You are authenticated as admin!', user: req.user });
  });
}
