import { inject, injectable } from 'tsyringe';
import { IDocumentRepository } from './document.repository.interface.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { InsertDocumentDTO, uploadSchema } from './document.dto.js';
import { IDocumentService, Document } from './document.service.interface.js';
import { DocumentFactory } from '../../entities/document/DocumentFactory.js';
import { Result } from '@carbonteq/fp';
import { PaginationOptions, PaginatedResult } from './document.repository.interface.js';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { MultipartFile } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';

@injectable()
export class DocumentService implements IDocumentService {
  private logger: ILogger;

  constructor(
    @inject('IDocumentRepository') private documentRepository: IDocumentRepository,
    @inject('ILogger') logger: ILogger,
    @inject('IConfigurationService') private config: IConfigurationService
  ) {
    this.logger = logger.child({ module: 'DocumentService' });
  }

  async uploadDocument(data: InsertDocumentDTO): Promise<Result<Document, Error>> {
    this.logger.info('Starting document upload', { 
      filename: data.filename, 
      mimetype: data.mimetype, 
      userId: data.userId 
    });
    
    // Build document entity via factory
    const entityResult = DocumentFactory.createDocument({
      filename: data.filename,
      mimetype: data.mimetype,
      path: data.path,
      tags: typeof data.tags === 'string' ? (() => { try { return JSON.parse(data.tags); } catch { return []; } })() : [],
      description: data.description ?? null,
      userId: data.userId,
    });
    if (entityResult.isErr()) {
      this.logger.error('Failed to build document entity', entityResult.unwrapErr(), { filename: data.filename });
      return Result.Err(new Error('Failed to create document'));
    }

    this.logger.debug('Persisting document entity in repository');
    const createResult = await this.documentRepository.createDocument(entityResult.unwrap());
    
    if (createResult.isErr()) {
      this.logger.error('Failed to create document', createResult.unwrapErr(), { 
        filename: data.filename, 
        userId: data.userId 
      });
      return Result.Err(new Error('Failed to create document'));
    }
    
    const document = createResult.unwrap();
    this.logger.info('Document uploaded successfully', { 
      documentId: document.id, 
      filename: document.filename 
    });
    return Result.Ok(document);
  }

  async getAllDocuments(pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    this.logger.info('Retrieving documents', { pagination });
    
    this.logger.debug('Fetching documents from repository');
    const documentsResult = await this.documentRepository.getAllDocuments(pagination);
    
    if (documentsResult.isErr()) {
      this.logger.error('Failed to get documents', documentsResult.unwrapErr());
      return Result.Err(new Error('Failed to get documents'));
    }
    
    const result = documentsResult.unwrap();
    if (Array.isArray(result)) {
      this.logger.info('Retrieved all documents successfully', { count: result.length });
    } else {
      this.logger.info('Retrieved paginated documents successfully', { 
        count: result.data.length,
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      });
    }
    return Result.Ok(result);
  }

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    this.logger.info('Starting document deletion', { documentId: id });
    
    this.logger.debug('Deleting document from repository');
    const deleteResult = await this.documentRepository.deleteDocument(id);
    
    if (deleteResult.isErr()) {
      this.logger.error('Failed to delete document', deleteResult.unwrapErr(), { documentId: id });
      return Result.Err(new Error('Failed to delete document'));
    }
    
    const deleted = deleteResult.unwrap();
    if (deleted) {
      this.logger.info('Document deleted successfully', { documentId: id });
    } else {
      this.logger.warn('Document not found for deletion', { documentId: id });
    }
    return Result.Ok(deleted);
  }

  async searchDocuments(criteria: { tags?: string[]; description?: string }, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    this.logger.info('Starting document search', { criteria, pagination });
    
    this.logger.debug('Searching documents in repository');
    const searchResult = await this.documentRepository.searchDocuments(criteria, pagination);
    
    if (searchResult.isErr()) {
      this.logger.error('Failed to search documents', searchResult.unwrapErr(), { criteria });
      return Result.Err(new Error('Failed to search documents'));
    }
    
    const result = searchResult.unwrap();
    if (Array.isArray(result)) {
      this.logger.info('Document search completed successfully', { 
        criteria, 
        count: result.length 
      });
    } else {
      this.logger.info('Document search completed successfully', { 
        criteria,
        count: result.data.length,
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      });
    }
    return Result.Ok(result);
  }

  async getDocumentById(id: string): Promise<Result<Document | null, Error>> {
    this.logger.debug('Getting document by ID', { documentId: id });
    
    const documentResult = await this.documentRepository.findById(id);
    
    if (documentResult.isErr()) {
      this.logger.error('Failed to get document by ID', documentResult.unwrapErr(), { documentId: id });
      return Result.Err(new Error('Failed to get document'));
    }
    
    const document = documentResult.unwrap();
    this.logger.debug('Document lookup completed', { 
      documentId: id, 
      found: !!document 
    });
    return Result.Ok(document);
  }

  async save(document: Document): Promise<Result<Document, Error>> {
    this.logger.debug('Saving updated document', { documentId: document.id });
    const res = await this.documentRepository.updateDocument(document);
    if (res.isErr()) {
      this.logger.error('Failed to save updated document', res.unwrapErr(), { documentId: document.id });
      return Result.Err(new Error('Failed to update document'));
    }
    return Result.Ok(res.unwrap());
  }

  // File handling methods (merged from FileHandlerService and FileUploadService)
  
  /**
   * Save uploaded file to disk
   * @param file - Multipart file from request
   * @returns Promise<FileInfo> - File information
   */
  async saveFile(file: MultipartFile): Promise<{ path: string; filename: string; mimetype: string; size: number }> {
    this.logger.debug('Saving file to disk', { filename: file.filename });
    
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.filename)}`;
    const uploadPath = path.join(this.config.app.upload.uploadDir, uniqueName);
    
    // Ensure upload directory exists
    await fs.promises.mkdir(this.config.app.upload.uploadDir, { recursive: true });
    
    // Write file to disk
    const writeStream = fs.createWriteStream(uploadPath);
    file.file.pipe(writeStream);
    
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      file.file.on('error', reject);
    });
    
    // Get file size
    const stats = fs.statSync(uploadPath);
    
    this.logger.debug('File saved successfully', { path: uploadPath, size: stats.size });
    
    return {
      path: uploadPath,
      filename: file.filename,
      mimetype: file.mimetype,
      size: stats.size,
    };
  }

  /**
   * Process file upload with validation and transformation
   * @param fileData - File upload data
   * @returns Promise<Result<InsertDocumentDTO, Error>> - Processed document data
   */
    async processFileUpload(fileData: { 
    file: { path: string; size: number; mimetype: string }; 
    fields: { filename: string; mimetype: string; tags?: string; description?: string }; 
    userId: string 
  }): Promise<Result<InsertDocumentDTO, Error>> {
    this.logger.info('Processing file upload', { filename: fileData.fields.filename });
    
    // Validate file size
    if (fileData.file.size > this.config.app.upload.maxFileSize) {
      this.logger.warn('File too large', { 
        filename: fileData.fields.filename, 
        size: fileData.file.size, 
        maxSize: this.config.app.upload.maxFileSize 
      });
      return Result.Err(new Error(
        `File too large. Maximum size is ${this.config.app.upload.maxFileSize / (1024 * 1024)}MB`
      ));
    }

    // Validate file type
    if (this.config.app.upload.allowedMimeTypes && !this.config.app.upload.allowedMimeTypes.includes(fileData.file.mimetype)) {
      this.logger.warn('File type not allowed', { 
        filename: fileData.fields.filename, 
        mimetype: fileData.file.mimetype 
      });
      return Result.Err(new Error(
        `File type not allowed. Allowed types: ${this.config.app.upload.allowedMimeTypes?.join(', ') || 'none specified'}`
      ));
    }

    // Parse tags
    let tagsString = '[]';
    if (fileData.fields.tags) {
      if (typeof fileData.fields.tags === 'string') {
        // Try to parse as JSON first, fallback to comma-separated
        const parseResult = this.parseTags(fileData.fields.tags);
        if (parseResult.isOk()) {
          tagsString = parseResult.unwrap();
        } else {
          // Fallback to comma-separated parsing
          tagsString = JSON.stringify(fileData.fields.tags.split(',').map((t: string) => t.trim()));
        }
      } else {
        tagsString = JSON.stringify(fileData.fields.tags);
      }
    }

    const description = fileData.fields.description || undefined;

    // Validate with Zod schema
    const validation = uploadSchema.safeParse({
      filename: fileData.fields.filename,
      mimetype: fileData.fields.mimetype,
      path: fileData.file.path,
      tags: tagsString,
      description,
      userId: fileData.userId,
    });

    if (!validation.success) {
      this.logger.warn('File validation failed', { 
        filename: fileData.fields.filename, 
        errors: validation.error.message 
      });
      return Result.Err(new Error(`Validation failed: ${validation.error.message}`));
    }

    this.logger.info('File upload processed successfully', { filename: fileData.fields.filename });
    return Result.Ok(validation.data);
  }

  /**
   * Parse tags string using Railway pattern
   * @param tagsString - String containing tags (JSON or comma-separated)
   * @returns Result<string, Error> - Parsed tags as JSON string or error
   */
  private parseTags(tagsString: string): Result<string, Error> {
    try {
      const parsed = JSON.parse(tagsString);
      if (Array.isArray(parsed)) {
        return Result.Ok(JSON.stringify(parsed.map(String)));
      } else if (typeof parsed === 'string') {
        return Result.Ok(JSON.stringify([parsed]));
      } else {
        return Result.Ok('[]');
      }
    } catch {
      return Result.Err(new Error('Invalid JSON format for tags'));
    }
  }

  /**
   * Complete file upload handler - processes multipart request and saves document
   * @param req - Fastify request with multipart data
   * @returns Promise<Result<Document, Error>> - Created document or error
   */
  async handleFileUpload(req: FastifyRequest): Promise<Result<Document, Error>> {
    this.logger.info('Starting file upload process');
    
    const parts = req.parts();
    let file: any = null;
    const fields: Record<string, string> = {};

    // Extract file and fields from multipart request
    for await (const part of parts) {
      if (part.type === 'file') {
        file = await this.saveFile(part);
      } else if (part.type === 'field') {
        fields[part.fieldname] = String(part.value);
      }
    }

    if (!file || !fields.filename || !fields.mimetype) {
      this.logger.warn('Missing file or required fields', { fields: Object.keys(fields) });
      return Result.Err(new Error('Missing file or required fields'));
    }

    const userId = (req.user as any)?.userId;
    if (!userId) {
      this.logger.warn('No userId found in request');
      return Result.Err(new Error('Unauthorized: No userId found'));
    }

    // Process file upload with business logic
    const uploadResult = await this.processFileUpload({
      file,
      fields: {
        filename: fields.filename,
        mimetype: fields.mimetype,
        tags: fields.tags,
        description: fields.description,
      },
      userId,
    });

    if (uploadResult.isErr()) {
      return uploadResult;
    }

    // Save document to database
    const documentResult = await this.uploadDocument(uploadResult.unwrap());
    
    if (documentResult.isOk()) {
      this.logger.info('Document uploaded successfully', { 
        documentId: documentResult.unwrap().id,
        filename: documentResult.unwrap().filename 
      });
    }
    
    return documentResult;
  }
}
