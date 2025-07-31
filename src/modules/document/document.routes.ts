import { FastifyInstance } from 'fastify';
import { DocumentController } from './document.controller.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { verifyJWT } from '../../middlewares/auth.js';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', { preHandler: requireAdmin }, DocumentController.upload);
  
  app.get('/', { preHandler: verifyJWT }, DocumentController.getAll);
  app.get('/:id', { preHandler: verifyJWT }, DocumentController.getById);
  app.get('/search', { preHandler: verifyJWT }, DocumentController.search);
  app.delete('/:id', { preHandler: requireAdmin }, DocumentController.deleteById);
  app.post('/:id/download-link', { preHandler: verifyJWT }, DocumentController.generateDownloadLink);
  app.get('/download/:token', DocumentController.downloadDocument);
}
