import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentService } from './document.service.js';
import { container } from '../../config/container.js';
import { ResponseHandler } from '../../shared/utils/ResponseHandler.js';
import { ValidationMiddleware } from '../../shared/middlewares/validation.js';
import { paginationQuerySchema } from '../../shared/dto/pagination.dto.js';
import { z } from 'zod';
import { Result } from '@carbonteq/fp';

// Get service instance from DI container
const documentService = container.resolve(DocumentService);

const documentIdSchema = z.object({
  id: z.uuid()
});

const downloadTokenSchema = z.object({
  token: z.string()
});

export const DocumentController = {
  async upload(req: FastifyRequest, reply: FastifyReply) {
    const result = await documentService.handleFileUpload(req);
    return ResponseHandler.upload(reply, result);
  },

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const result = await documentService.getAllDocuments(req.query as any);
    return ResponseHandler.paginated(reply, result);
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await documentService.getDocumentById(id);
    return ResponseHandler.optional(reply, result, 'Document not found');
  },

  async deleteById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await documentService.deleteDocument(id);
    return ResponseHandler.boolean(
      reply, 
      result, 
      'Document deleted successfully', 
      'Document not found'
    );
  },

  async search(req: FastifyRequest, reply: FastifyReply) {
    const { tags, description } = req.query as { tags?: string; description?: string };
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    
    const result = await documentService.searchDocuments(
      { tags: tagArray, description }, 
      req.query as any
    );
    return ResponseHandler.paginated(reply, result);
  },

  async generateDownloadLink(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    const result = await documentService.getDocumentById(id);
    if (result.isErr()) {
      return ResponseHandler.error(reply, result.unwrapErr(), 500);
    }

    const document = result.unwrap();
    if (!document) {
      return ResponseHandler.error(reply, new Error('Document not found'), 404);
    }
    
    const token = await reply.server.jwt.sign(
      { docId: id },
      { expiresIn: '5m' }
    );
    const url = `/api/documents/download/${token}`;
    
    return ResponseHandler.success(reply, Result.Ok({ url }), 200);
  },

  async downloadDocument(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.params as { token: string };
    
    let payload: any;
    try {
      payload = await reply.server.jwt.verify(token);
    } catch (err) {
      return ResponseHandler.error(reply, new Error('Invalid or expired download link'), 401);
    }
    
    const result = await documentService.getDocumentById(payload.docId);
    if (result.isErr()) {
      return ResponseHandler.error(reply, result.unwrapErr(), 500);
    }

    const document = result.unwrap();
    if (!document) {
      return ResponseHandler.error(reply, new Error('Document not found'), 404);
    }
    return reply.sendFile(document.path);
  },
};

// Export validation middleware for routes
export const DocumentValidation = {
  getById: ValidationMiddleware.params(documentIdSchema),
  deleteById: ValidationMiddleware.params(documentIdSchema),
  search: ValidationMiddleware.query(paginationQuerySchema),
  generateDownloadLink: ValidationMiddleware.params(documentIdSchema),
  downloadDocument: ValidationMiddleware.params(downloadTokenSchema)
};
