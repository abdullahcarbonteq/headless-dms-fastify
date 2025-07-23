import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';

export default async function userRoutes(app: FastifyInstance) {
  app.post('/register', UserController.register);
  app.post('/login', UserController.login);
}
