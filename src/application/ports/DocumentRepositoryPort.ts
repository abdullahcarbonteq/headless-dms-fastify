import { Result } from '@carbonteq/fp';
import { Document } from '../../domain/entities/document/Document.js';
import type { PaginationOptions, PaginatedResult } from '../../shared/dto/pagination.dto.js';

export interface DocumentSearchCriteria {
  tags?: string[];
  description?: string;
  userId?: string;
}

export interface DocumentRepositoryPort {
  createDocument(document: Document): Promise<Result<Document, Error>>;
  findById(id: string): Promise<Result<Document | null, Error>>;
  getAllDocuments(pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>>;
  deleteDocument(id: string): Promise<Result<boolean, Error>>;
  updateDocument(document: Document): Promise<Result<Document, Error>>;
  searchDocuments(criteria: DocumentSearchCriteria, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>>;
}

export type { Document };

