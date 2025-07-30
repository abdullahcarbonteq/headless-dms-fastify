import { inject, injectable } from 'tsyringe';
import { IDocumentRepository } from '../interfaces/IDocumentRepository.js';
import { ILogger } from '../../../shared/interfaces/ILogger.js';
import { InsertDocumentDTO } from '../document.dto.js';
import { IDocumentService, Document } from '../interfaces/IDocumentService.js';
import { Result } from '@carbonteq/fp';
import { PaginationOptions, PaginatedResult } from '../interfaces/IDocumentRepository.js';

@injectable()
export class DocumentService implements IDocumentService {
  private logger: ILogger;

  constructor(
    @inject('IDocumentRepository') private documentRepository: IDocumentRepository,
    @inject('ILogger') logger: ILogger
  ) {
    this.logger = logger.child({ module: 'DocumentService' });
  }

  async uploadDocument(data: InsertDocumentDTO): Promise<Result<Document, Error>> {
    this.logger.info('Starting document upload', { 
      filename: data.filename, 
      mimetype: data.mimetype, 
      userId: data.userId 
    });
    
    try {
      this.logger.debug('Creating document in repository');
      const createResult = await this.documentRepository.createDocument(data);
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
    } catch (error) {
      this.logger.error('Unexpected error during document upload', error instanceof Error ? error : new Error('Unknown error'), { 
        filename: data.filename, 
        userId: data.userId 
      });
      return Result.Err(error instanceof Error ? error : new Error('Failed to upload document'));
    }
  }

  async getAllDocuments(pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    this.logger.info('Retrieving documents', { pagination });
    
    try {
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
    } catch (error) {
      this.logger.error('Unexpected error getting documents', error instanceof Error ? error : new Error('Unknown error'));
      return Result.Err(error instanceof Error ? error : new Error('Failed to get documents'));
    }
  }

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    this.logger.info('Starting document deletion', { documentId: id });
    
    try {
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
    } catch (error) {
      this.logger.error('Unexpected error deleting document', error instanceof Error ? error : new Error('Unknown error'), { documentId: id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  }

  async searchDocuments(criteria: { tags?: string[]; description?: string }, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    this.logger.info('Starting document search', { criteria, pagination });
    
    try {
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
    } catch (error) {
      this.logger.error('Unexpected error searching documents', error instanceof Error ? error : new Error('Unknown error'), { criteria });
      return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  }

  async getDocumentById(id: string): Promise<Result<Document | null, Error>> {
    this.logger.debug('Getting document by ID', { documentId: id });
    
    try {
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
    } catch (error) {
      this.logger.error('Unexpected error getting document by ID', error instanceof Error ? error : new Error('Unknown error'), { documentId: id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to get document'));
    }
  }
}
