import { IDocumentRepository } from '../interfaces/IDocumentRepository.js';
import { InsertDocumentDTO } from '../document.dto.js';
import { IDocumentService, Document } from '../interfaces/IDocumentService.js';
import { Result } from '@carbonteq/fp';
import { config } from '../../../config/index.js';

// TODO: This will be injected via DI in Phase 2D
const documentRepository: IDocumentRepository = new (await import('../repositories/DrizzleDocumentRepository.js')).DrizzleDocumentRepository();

export const DocumentService: IDocumentService = {
  async uploadDocument(data: InsertDocumentDTO): Promise<Result<Document, Error>> {
    try {
      const createResult = await documentRepository.createDocument(data);
      if (createResult.isErr()) {
        return Result.Err(new Error('Failed to create document'));
      }
      return Result.Ok(createResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to upload document'));
    }
  },

  async getAllDocuments(): Promise<Result<Document[], Error>> {
    try {
      const documentsResult = await documentRepository.getAllDocuments();
      if (documentsResult.isErr()) {
        return Result.Err(new Error('Failed to get documents'));
      }
      return Result.Ok(documentsResult.unwrap() as Document[]);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get documents'));
    }
  },

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    try {
      const deleteResult = await documentRepository.deleteDocument(id);
      if (deleteResult.isErr()) {
        return Result.Err(new Error('Failed to delete document'));
      }
      return Result.Ok(deleteResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  },

  async searchDocuments(criteria: { tags?: string[]; description?: string }): Promise<Result<Document[], Error>> {
    try {
      const searchResult = await documentRepository.searchDocuments(criteria);
      if (searchResult.isErr()) {
        return Result.Err(new Error('Failed to search documents'));
      }
      return Result.Ok(searchResult.unwrap() as Document[]);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  },

  async getDocumentById(id: string): Promise<Result<Document | null, Error>> {
    try {
      const documentResult = await documentRepository.findById(id);
      if (documentResult.isErr()) {
        return Result.Err(new Error('Failed to get document'));
      }
      return Result.Ok(documentResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get document'));
    }
  }
};
