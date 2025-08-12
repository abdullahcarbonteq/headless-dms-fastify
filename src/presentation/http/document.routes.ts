import { FastifyInstance } from 'fastify';
import { DocumentHttpController, DocumentHttpValidation } from './document.controller.js';
import { requireAdmin, verifyJWT } from './middlewares/auth.js';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', { preHandler: verifyJWT }, DocumentHttpController.upload);
  app.get('/', { preHandler: [verifyJWT, DocumentHttpValidation.getAll] }, DocumentHttpController.getAll);
  app.get('/:id', { preHandler: [verifyJWT, DocumentHttpValidation.getById] }, DocumentHttpController.getById);
  app.get('/search', { preHandler: [verifyJWT, DocumentHttpValidation.search] }, DocumentHttpController.search);
  app.put('/:id/metadata', { preHandler: [verifyJWT, DocumentHttpValidation.updateMetadata] }, DocumentHttpController.updateMetadata);
  app.delete('/:id', { preHandler: [requireAdmin, DocumentHttpValidation.deleteById] }, DocumentHttpController.deleteById);
  app.post('/:id/download-link', { preHandler: [verifyJWT, DocumentHttpValidation.generateDownloadLink] }, DocumentHttpController.generateDownloadLink);
  app.get('/download/:token', { preHandler: DocumentHttpValidation.downloadDocument }, DocumentHttpController.downloadDocument);
}

