import { Document, DocumentStatus } from './Document.js';
import { DocumentValidator } from './DocumentValidator.js';
import { Result } from '@carbonteq/fp';
import { v4 as uuidv4 } from 'uuid';

export type CreateDocumentData = {
  filename: string;
  mimetype: string;
  path: string;
  tags?: string[];
  description?: string | null;
  userId: string;
};

export class DocumentFactory {
  /**
   * Create a new document entity
   */
  static createDocument(data: CreateDocumentData): Result<Document, Error> {
    try {
      // Validate input data
      if (!DocumentValidator.validateCreateDocumentData(data)) {
        return Result.Err(new Error('Invalid document data'));
      }

      // Create document entity
      const document = new Document(
        uuidv4(),
        data.filename,
        data.mimetype,
        data.path,
        data.tags || [],
        data.description || null,
        data.userId,
        DocumentStatus.ACTIVE
      );

      // Validate the created entity
      if (!document.validate()) {
        return Result.Err(new Error('Created document is invalid'));
      }

      return Result.Ok(document);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create document'));
    }
  }

  /**
   * Create a document entity from existing data (for updates)
   */
  static fromData(data: {
    id: string;
    filename: string;
    mimetype: string;
    path: string;
    tags: string[];
    description: string | null;
    userId: string;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Document, Error> {
    try {
      // Validate status
      if (!DocumentValidator.validateStatus(data.status)) {
        return Result.Err(new Error('Invalid document status'));
      }

      // Create document entity
      const document = new Document(
        data.id,
        data.filename,
        data.mimetype,
        data.path,
        data.tags,
        data.description,
        data.userId,
        data.status as DocumentStatus,
        data.createdAt,
        data.updatedAt
      );

      // Validate the created entity
      if (!document.validate()) {
        return Result.Err(new Error('Document data is invalid'));
      }

      return Result.Ok(document);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create document from data'));
    }
  }

  /**
   * Create a document entity from database row
   */
  static fromDatabaseRow(row: any): Result<Document, Error> {
    try {
      // Validate required fields
      if (!row.id || !row.filename || !row.mimetype || !row.path) {
        return Result.Err(new Error('Missing required document fields'));
      }

      // Get userId from either property name or column name
      const userId = row.userId || row.user_id;
      if (!userId) {
        return Result.Err(new Error('Missing userId in document data'));
      }

      // Parse tags from JSON string if needed
      let tags: string[] = [];
      if (row.tags) {
        try {
          tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
        } catch {
          tags = [];
        }
      }

      // Create document entity
      const document = new Document(
        row.id,
        row.filename,
        row.mimetype,
        row.path,
        tags,
        row.description || null,
        userId,
        row.status || DocumentStatus.ACTIVE,
        row.createdAt ? new Date(row.createdAt) : row.created_at ? new Date(row.created_at) : undefined,
        row.updatedAt ? new Date(row.updatedAt) : row.updated_at ? new Date(row.updated_at) : undefined
      );

      // Validate the created entity
      if (!document.validate()) {
        return Result.Err(new Error('Invalid document data from database'));
      }

      return Result.Ok(document);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create document from database row'));
    }
  }

  /**
   * Create a document entity for testing purposes
   */
  static createTestDocument(overrides: Partial<CreateDocumentData> = {}): Document {
    const defaultData: CreateDocumentData = {
      filename: 'test-document.pdf',
      mimetype: 'application/pdf',
      path: '/uploads/test-document.pdf',
      tags: ['test', 'document'],
      description: 'A test document',
      userId: 'test-user-id',
      ...overrides
    };

    const result = this.createDocument(defaultData);
    if (result.isErr()) {
      throw new Error('Failed to create test document: ' + result.unwrapErr().message);
    }

    return result.unwrap();
  }

  /**
   * Create multiple document entities from database rows
   */
  static fromDatabaseRows(rows: any[]): Result<Document[], Error> {
    const documents: Document[] = [];

    for (const row of rows) {
      const documentResult = this.fromDatabaseRow(row);
      if (documentResult.isErr()) {
        return Result.Err(documentResult.unwrapErr());
      }
      documents.push(documentResult.unwrap());
    }

    return Result.Ok(documents);
  }
} 