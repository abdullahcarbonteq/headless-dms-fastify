import { FastifyInstance } from 'fastify';
import { DocumentController } from './document.controller';
import { minimalUploadHandler } from './document.controller';
import { requireAdmin } from '../../utils/middlewares/auth';
import { verifyJWT } from '../../middlewares/auth';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', { preHandler: requireAdmin }, DocumentController.upload);
  app.post('/upload/minimal', minimalUploadHandler);
  app.get('/', { preHandler: verifyJWT }, DocumentController.getAll);
  app.delete('/:id', { preHandler: requireAdmin }, DocumentController.deleteById);
}
