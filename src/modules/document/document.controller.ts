import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentService } from './document.service.js';
import { container } from '../../config/container.js';
import { ResponseHandler } from '../../shared/utils/ResponseHandler.js';
import { ValidationMiddleware } from '../../shared/middlewares/validation.js';
import { paginationQuerySchema } from '../../shared/dto/pagination.dto.js';
import { z } from 'zod';
import { Result } from '@carbonteq/fp';
import { IAuthService } from '../../shared/interfaces/IAuthService.js';
import { updateMetadataSchema, searchQuerySchema } from './document.dto.js';

// Get service instance from DI container
const documentService = container.resolve(DocumentService);
const authService = container.resolve<IAuthService>('IAuthService');

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

  async updateMetadata(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const body = req.body as unknown;
    const parsed = updateMetadataSchema.safeParse(body);
    if (!parsed.success) {
      return ResponseHandler.error(reply, new Error(parsed.error.message), 400);
    }

    const result = await documentService.getDocumentById(id);
    if (result.isErr()) {
      return ResponseHandler.error(reply, result.unwrapErr(), 500);
    }
    const existing = result.unwrap();
    if (!existing) {
      return ResponseHandler.error(reply, new Error('Document not found'), 404);
    }

    let updated = existing;
    const { tags, description } = parsed.data;
    if (tags) {
      const replaceRes = updated.replaceTags(tags);
      if (replaceRes.isErr()) return ResponseHandler.error(reply, replaceRes.unwrapErr(), 400);
      updated = replaceRes.unwrap();
    }
    if (description !== undefined) {
      const descRes = updated.updateDescription(description ?? null);
      if (descRes.isErr()) return ResponseHandler.error(reply, descRes.unwrapErr(), 400);
      updated = descRes.unwrap();
    }

    const saveRes = await documentService.save(updated);
    if (saveRes.isErr()) {
      return ResponseHandler.error(reply, saveRes.unwrapErr(), 500);
    }
    return ResponseHandler.success(reply, saveRes, 200, 'Metadata updated successfully');
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
    
    const tokenRes = await authService.generateDownloadToken({ docId: id });
    if (tokenRes.isErr()) {
      return ResponseHandler.error(reply, new Error('Failed to generate download link'), 500);
    }
    const url = `/api/documents/download/${tokenRes.unwrap()}`;
    
    return ResponseHandler.success(reply, Result.Ok({ url }), 200);
  },

  async downloadDocument(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.params as { token: string };
    
    const payloadRes = await authService.verifyDownloadToken(token);
    if (payloadRes.isErr()) {
      return ResponseHandler.error(reply, new Error('Invalid or expired download link'), 401);
    }
    const payload = payloadRes.unwrap();
    
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
  getAll: ValidationMiddleware.query(paginationQuerySchema),
  getById: ValidationMiddleware.params(documentIdSchema),
  deleteById: ValidationMiddleware.params(documentIdSchema),
  search: ValidationMiddleware.query(searchQuerySchema),
  generateDownloadLink: ValidationMiddleware.params(documentIdSchema),
  downloadDocument: ValidationMiddleware.params(downloadTokenSchema),
  updateMetadata: ValidationMiddleware.all({
    params: documentIdSchema,
    body: updateMetadataSchema,
  }),
};
