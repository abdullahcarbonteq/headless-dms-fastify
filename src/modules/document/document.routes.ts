import { FastifyInstance } from 'fastify';
import { DocumentController } from './document.controller';
import { minimalUploadHandler } from './document.controller';

export default async function documentRoutes(app: FastifyInstance) {
  app.post('/upload', DocumentController.upload);
  app.post('/upload/minimal', minimalUploadHandler);
}
