import { FastifyInstance } from 'fastify';
import { DocumentController, DocumentValidation } from './document.controller.js';
import { requireAdmin } from '../../middlewares/auth.js';
import { verifyJWT } from '../../middlewares/auth.js';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', { preHandler: requireAdmin }, DocumentController.upload);
  
  app.get('/', { preHandler: [verifyJWT, DocumentValidation.getAll] }, DocumentController.getAll);
  app.get('/:id', { preHandler: [verifyJWT, DocumentValidation.getById] }, DocumentController.getById);
  app.put('/:id/metadata', { preHandler: [verifyJWT, DocumentValidation.updateMetadata] }, DocumentController.updateMetadata);
  app.get('/search', { preHandler: [verifyJWT, DocumentValidation.search] }, DocumentController.search);
  app.delete('/:id', { preHandler: [requireAdmin, DocumentValidation.deleteById] }, DocumentController.deleteById);
  app.post('/:id/download-link', { preHandler: [verifyJWT, DocumentValidation.generateDownloadLink] }, DocumentController.generateDownloadLink);
  app.get('/download/:token', { preHandler: DocumentValidation.downloadDocument }, DocumentController.downloadDocument);
}
