import { Document } from '../../domain/entities/document/Document.js';
import type { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated, AppResult } from '@carbonteq/hexapp';

export interface DocumentSearchCriteria {
  tags?: string[];
  description?: string;
  userId?: string;
}

export interface DocumentRepositoryPort {
  createDocument(document: Document): Promise<AppResult<Document>>;
  findById(id: string): Promise<AppResult<Document | null>>;
  getAllDocuments(pagination?: HexPaginationOptions): Promise<AppResult<HexPaginated<Document>>>;
  deleteDocument(id: string): Promise<AppResult<boolean>>;
  updateDocument(document: Document): Promise<AppResult<Document>>;
  searchDocuments(criteria: DocumentSearchCriteria, pagination?: HexPaginationOptions): Promise<AppResult<HexPaginated<Document>>>;
}

export type { Document };

