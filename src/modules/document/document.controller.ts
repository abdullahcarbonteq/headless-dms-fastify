import { FastifyReply, FastifyRequest } from 'fastify';
import { DocumentService } from './document.service.js';
import { Result } from '@carbonteq/fp';
import { container } from '../../config/container.js';
import { paginationQuerySchema, type PaginationQuery } from '../../shared/dto/pagination.dto.js';

// Get service instance from DI container
const documentService = container.resolve(DocumentService);

export const DocumentController = {
  async upload(req: FastifyRequest, reply: FastifyReply) {
    const result = await documentService.handleFileUpload(req);
    
    if (result.isOk()) {
      return reply.status(201).send({
        message: 'Document uploaded successfully',
        document: result.unwrap(),
      });
    } else {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }
  },

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    // Parse pagination query parameters
    const paginationQuery = paginationQuerySchema.safeParse(req.query);
    if (!paginationQuery.success) {
      return reply.status(400).send({ error: 'Invalid pagination parameters' });
    }

    const result = await documentService.getAllDocuments(paginationQuery.data);
    
    if (result.isOk()) {
      const data = result.unwrap();
      if (Array.isArray(data)) {
        // No pagination requested, return simple array
        return reply.send({ 
          success: true,
          documents: data 
        });
      } else {
        // Paginated result
        return reply.send({
          success: true,
          documents: data.data,
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            totalPages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1
          }
        });
      }
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await documentService.getDocumentById(id);
    
    if (result.isOk()) {
      const document = result.unwrap();
      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }
      return reply.send({ document });
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async deleteById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await documentService.deleteDocument(id);
    
    if (result.isOk()) {
      const deleted = result.unwrap();
      if (deleted) {
        return reply.send({ message: 'Document deleted successfully' });
      } else {
        return reply.status(404).send({ error: 'Document not found' });
      }
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async search(req: FastifyRequest, reply: FastifyReply) {
    const { tags, description } = req.query as { tags?: string; description?: string };
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
    
    // Parse pagination query parameters
    const paginationQuery = paginationQuerySchema.safeParse(req.query);
    if (!paginationQuery.success) {
      return reply.status(400).send({ error: 'Invalid pagination parameters' });
    }
    
    const result = await documentService.searchDocuments(
      { tags: tagArray, description }, 
      paginationQuery.data
    );
    
    if (result.isOk()) {
      const data = result.unwrap();
      if (Array.isArray(data)) {
        // No pagination requested, return simple array
        return reply.send({ 
          success: true,
          documents: data 
        });
      } else {
        // Paginated result
        return reply.send({
          success: true,
          documents: data.data,
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            totalPages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1
          }
        });
      }
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async generateDownloadLink(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    
    const result = await documentService.getDocumentById(id);
    
    if (result.isOk()) {
      const document = result.unwrap();
      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }
      
      const token = await reply.server.jwt.sign(
        { docId: id },
        { expiresIn: '5m' }
      );
      const url = `/api/documents/download/${token}`;
      return reply.send({ url });
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },

  async downloadDocument(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.params as { token: string };
    
    let payload: any;
    try {
      payload = await reply.server.jwt.verify(token);
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid or expired download link' });
    }
    
    const result = await documentService.getDocumentById(payload.docId);
    
    if (result.isOk()) {
      const document = result.unwrap();
      if (!document) {
        return reply.status(404).send({ error: 'Document not found' });
      }
      // Serve the file
      return reply.sendFile(document.path);
    } else {
      return reply.status(500).send({ error: result.unwrapErr().message });
    }
  },
};
