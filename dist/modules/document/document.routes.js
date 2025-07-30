import { DocumentController } from './document.controller.js';
import { minimalUploadHandler } from './document.controller.js';
import { requireAdmin } from '../../utils/middlewares/auth.js';
import { verifyJWT } from '../../middlewares/auth.js';
export default async function documentRoutes(app) {
    app.post('/upload', { preHandler: requireAdmin }, DocumentController.upload);
    app.post('/upload/minimal', minimalUploadHandler);
    app.get('/', { preHandler: verifyJWT }, DocumentController.getAll);
    app.get('/search', { preHandler: verifyJWT }, DocumentController.search);
    app.delete('/:id', { preHandler: requireAdmin }, DocumentController.deleteById);
    app.post('/:id/download-link', { preHandler: verifyJWT }, DocumentController.generateDownloadLink);
    app.get('/download/:token', DocumentController.downloadDocument);
}
