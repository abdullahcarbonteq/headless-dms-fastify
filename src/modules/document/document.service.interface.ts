import { InsertDocumentDTO } from './document.dto.js';
import { documents } from './document.schema.js';
import { Result } from '@carbonteq/fp';
import { PaginationOptions, PaginatedResult } from './document.repository.interface.js';

// Document type based on the schema
export type Document = typeof documents.$inferSelect;

export interface IDocumentService {
  /**
   * Upload a new document
   * @param data - Document upload data
   * @returns Promise<Result<Document, Error>> - Success with document data or error
   */
  uploadDocument(data: InsertDocumentDTO): Promise<Result<Document, Error>>;

  /**
   * Get all documents with optional pagination
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
   * Search documents by criteria with optional pagination
   * @param criteria - Search criteria (tags, description)
   * @param pagination - Optional pagination options
   * @returns Promise<Result<Document[] | PaginatedResult<Document>, Error>> - Success with matching documents or error
   */
  searchDocuments(criteria: { tags?: string[]; description?: string }, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>>;

  /**
   * Get document by ID
   * @param id - Document ID
   * @returns Promise<Result<Document | null, Error>> - Success with document or null, or error
   */
  getDocumentById(id: string): Promise<Result<Document | null, Error>>;
} 