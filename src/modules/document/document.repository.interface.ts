import { Document } from '../../entities/document/Document.js';
import { Result } from '@carbonteq/fp';

// Re-export Document for convenience
export { Document } from '../../entities/document/Document.js';

// Search criteria for document queries
export interface DocumentSearchCriteria {
  tags?: string[];
  description?: string;
  userId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IDocumentRepository {
  /**
   * Create a new document in the store
   * @param data - Document entity
   * @returns Promise<Result<Document, Error>> - Success with document data or error
   */
  createDocument(data: Document): Promise<Result<Document, Error>>;

  /**
   * Find document by ID
   * @param id - Document ID
   * @returns Promise<Result<Document | null, Error>> - Success with document or null, or error
   */
  findById(id: string): Promise<Result<Document | null, Error>>;

  /**
   * Get all documents from the store
   * @param pagination - Optional pagination options
   * @returns Promise<Result<Document[] | PaginatedResult<Document>, Error>> - Success with documents or error
   */
  getAllDocuments(pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>>;

  /**
   * Delete document by ID
   * @param id - Document ID
   * @returns Promise<Result<boolean, Error>> - Success with deletion status or error
   */
  deleteDocument(id: string): Promise<Result<boolean, Error>>;

  /**
   * Update an existing document in the store
   * @param document - Document entity with updated fields
   */
  updateDocument(document: Document): Promise<Result<Document, Error>>;

  /**
   * Search documents by criteria
   * @param criteria - Search criteria (tags, description, userId)
   * @param pagination - Optional pagination options
   * @returns Promise<Result<Document[] | PaginatedResult<Document>, Error>> - Success with matching documents or error
   */
  searchDocuments(criteria: DocumentSearchCriteria, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>>;

} 