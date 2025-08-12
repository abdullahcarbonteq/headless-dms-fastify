import { FastifyReply, FastifyRequest } from 'fastify';
import { container } from '../../infrastructure/bootstrap/container.js';
import { ResponseHandler } from './utils/ResponseHandler.js';
import { ValidationMiddleware } from './middlewares/validation.js';
import { paginationQuerySchema } from '../../shared/dto/pagination.dto.js';
import { z } from 'zod';
import { Result } from '@carbonteq/fp';
import { updateDocumentMetadataRequestSchema } from './validators/document.update-metadata.request.schema.js';
import { searchDocumentsRequestSchema } from './validators/document.search.request.schema.js';
import { UploadDocumentUseCase } from '../../application/use-cases/document/UploadDocumentUseCase.js';
import { GetAllDocumentsUseCase } from '../../application/use-cases/document/GetAllDocumentsUseCase.js';
import { GetDocumentByIdUseCase } from '../../application/use-cases/document/GetDocumentByIdUseCase.js';
import { UpdateDocumentMetadataUseCase } from '../../application/use-cases/document/UpdateDocumentMetadataUseCase.js';
import { DeleteDocumentUseCase } from '../../application/use-cases/document/DeleteDocumentUseCase.js';
import { SearchDocumentsUseCase } from '../../application/use-cases/document/SearchDocumentsUseCase.js';
import { GenerateDownloadLinkUseCase } from '../../application/use-cases/document/GenerateDownloadLinkUseCase.js';
import { IAuthService } from '../../shared/interfaces/IAuthService.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import type { FileStoragePort } from '../../application/ports/FileStoragePort.js';

const uploadDocument = container.resolve(UploadDocumentUseCase);
const getAllDocuments = container.resolve(GetAllDocumentsUseCase);
const getDocumentById = container.resolve(GetDocumentByIdUseCase);
const updateDocumentMetadata = container.resolve(UpdateDocumentMetadataUseCase);
const deleteDocument = container.resolve(DeleteDocumentUseCase);
const searchDocuments = container.resolve(SearchDocumentsUseCase);
const generateDownloadLink = container.resolve(GenerateDownloadLinkUseCase);
const authService = container.resolve<IAuthService>('IAuthService');
const fileStorage = container.resolve<FileStoragePort>('FileStoragePort');
const logger = container.resolve<ILogger>('ILogger').child({ module: 'DocumentHttpController' });

const documentIdSchema = z.object({ id: z.uuid() });
const downloadTokenSchema = z.object({ token: z.string() });

export const DocumentHttpController = {
  async upload(req: FastifyRequest, reply: FastifyReply) {
    // Approach A: controller parses multipart, saves via FileStoragePort, then calls use case
    try {
      // Extract file and fields (enforce single file)
      // @ts-ignore - fastify multipart provides parts() at runtime
      const parts = (req as any).parts();
      let filePart: any = null;
      let multipleFilesDetected = false;
      const fields: Record<string, string> = {};
      let saved: { path: string; filename: string; mimetype: string; size: number } | null = null;

      try {
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!filePart) {
              filePart = part; // { filename, mimetype, file: Readable }
              // Consume the file stream immediately to avoid stalling the iterator
              const saveRes = await fileStorage.save(part.file, part.filename, part.mimetype);
              if (saveRes.isErr()) {
                return ResponseHandler.error(reply, saveRes.unwrapErr(), 400);
              }
              saved = saveRes.unwrap();
            } else {
              multipleFilesDetected = true;
              try { part.file.resume(); } catch {}
            }
          } else if (part.type === 'field') {
            fields[part.fieldname] = String(part.value);
          }
        }
      } catch (iterErr) {
        return ResponseHandler.error(reply, new Error('Failed to read upload stream (possibly exceeded size limits)'), 413);
      }

      // Allow alternate client keys similar to the previous working flow
      const providedFilename = fields.filename ?? fields.name ?? saved?.filename ?? filePart?.filename;
      const providedMimetype = fields.mimetype ?? fields.mimeType ?? saved?.mimetype ?? filePart?.mimetype;

      if (multipleFilesDetected) {
        return ResponseHandler.error(reply, new Error('Only one file is allowed per request'), 400);
      }
      if (!saved || !providedFilename || !providedMimetype) {
        return ResponseHandler.error(reply, new Error('Missing file or required fields (filename, mimetype)'), 400);
      }
      // Note: file already saved during parts iteration; `saved` contains file info

      // Get user id from JWT (set by verifyJWT/requireAdmin)
      const userId = (req.user as any)?.userId;
      if (!userId) {
        return ResponseHandler.error(reply, new Error('Unauthorized: No userId found'), 401);
      }

      // Build tags/description from fields (robust parsing like the previous implementation)
      let tags: string[] | undefined;
      if (typeof fields.tags === 'string') {
        try {
          const parsed = JSON.parse(fields.tags);
          if (Array.isArray(parsed)) {
            tags = parsed.map((t: unknown) => String(t)).filter(Boolean);
          } else if (typeof parsed === 'string') {
            tags = [parsed].filter(Boolean);
          }
        } catch {
          tags = fields.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean);
        }
      }
      const description = typeof fields.description === 'string' ? fields.description : undefined;

      // Call use case
      const result = await uploadDocument.execute({
        filename: saved.filename,
        mimetype: saved.mimetype,
        path: saved.path,
        tags,
        description,
        userId,
      });
      return ResponseHandler.upload(reply, result);
    } catch (err) {
      return ResponseHandler.error(reply, err instanceof Error ? err : new Error('Upload failed'));
    }
  },

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const { page, limit } = (req.query as any) || {};
    const result = await getAllDocuments.execute({ page, limit });
    return ResponseHandler.paginated(reply, result as any);
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await getDocumentById.execute(id);
    return ResponseHandler.optional(reply, result, 'Document not found');
  },

  async updateMetadata(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const result = await updateDocumentMetadata.execute({ id, ...body });
    if (result.isErr()) return ResponseHandler.error(reply, result.unwrapErr(), 400);
    return ResponseHandler.success(reply, result, 200, 'Metadata updated successfully');
  },

  async deleteById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await deleteDocument.execute({ id });
    return ResponseHandler.boolean(reply, result, 'Document deleted successfully', 'Document not found');
  },

  async search(req: FastifyRequest, reply: FastifyReply) {
    const { tags, description, page, limit } = (req.query as any) || {};
    const tagArray = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : tags;
    const result = await searchDocuments.execute({ tags: tagArray, description, page, limit });
    return ResponseHandler.paginated(reply, result as any);
  },

  async generateDownloadLink(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const res = await generateDownloadLink.execute({ id });
    if (res.isErr()) return ResponseHandler.error(reply, res.unwrapErr(), 500);
    return ResponseHandler.success(reply, Result.Ok(res.unwrap()), 200);
  },

  async downloadDocument(req: FastifyRequest, reply: FastifyReply) {
    const { token } = req.params as { token: string };
    const payloadRes = await authService.verifyDownloadToken(token);
    if (payloadRes.isErr()) return ResponseHandler.error(reply, new Error('Invalid or expired download link'), 401);
    const payload = payloadRes.unwrap();
    const result = await getDocumentById.execute(payload.docId);
    if (result.isErr()) return ResponseHandler.error(reply, result.unwrapErr(), 500);
    const doc = result.unwrap();
    if (!doc) return ResponseHandler.error(reply, new Error('Document not found'), 404);
    // fastifyStatic is configured with root pointing at uploads directory and expects a relative path
    // Ensure we serve by basename so it resolves under the static root
    const base = (doc.path || '').split('/').pop();
    if (!base) return ResponseHandler.error(reply, new Error('Invalid stored file path'), 404);
    return reply.sendFile(base);
  },
};

export const DocumentHttpValidation = {
  getAll: ValidationMiddleware.query(paginationQuerySchema),
  getById: ValidationMiddleware.params(documentIdSchema),
  deleteById: ValidationMiddleware.params(documentIdSchema),
  search: ValidationMiddleware.query(searchDocumentsRequestSchema),
  generateDownloadLink: ValidationMiddleware.params(documentIdSchema),
  downloadDocument: ValidationMiddleware.params(downloadTokenSchema),
  updateMetadata: ValidationMiddleware.all({ params: documentIdSchema, body: updateDocumentMetadataRequestSchema }),
};

