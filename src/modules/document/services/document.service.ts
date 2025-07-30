import { DocumentRepository } from '../document.repository.js';
import { InsertDocumentDTO } from '../document.dto.js';
import { IDocumentService, Document } from '../interfaces/IDocumentService.js';
import { Result } from '@carbonteq/fp';
import { config } from '../../../config/index.js';

export const DocumentService: IDocumentService = {
  async uploadDocument(data: InsertDocumentDTO): Promise<Result<Document, Error>> {
    try {
      const doc = await DocumentRepository.create(data);
      return Result.Ok(doc);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to upload document'));
    }
  },

  async getAllDocuments(): Promise<Result<Document[], Error>> {
    try {
      const documents = await DocumentRepository.getAll();
      return Result.Ok(documents);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get documents'));
    }
  },

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await DocumentRepository.deleteById(id);
      const deleted = (result.rowCount ?? 0) > 0;
      return Result.Ok(deleted);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  },

  async searchDocuments(criteria: { tags?: string[]; description?: string }): Promise<Result<Document[], Error>> {
    try {
      const documents = await DocumentRepository.search(criteria);
      return Result.Ok(documents);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  },

  async getDocumentById(id: string): Promise<Result<Document | null, Error>> {
    try {
      const documents = await DocumentRepository.getAll();
      const document = documents.find(doc => doc.id === id);
      return Result.Ok(document || null);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get document'));
    }
  }
};
