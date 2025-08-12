import { Document, DocumentStatus } from './Document.js';
import { FileName } from '../../value-objects/FileName.js';
import { PathVO } from '../../value-objects/PathVO.js';
import { Result } from '@carbonteq/fp';
import { DocumentId, UserId } from '../../value-objects/Ids.js';
import { MimeType } from '../../value-objects/MimeType.js';
import { TagList } from '../../value-objects/TagList.js';
import { Description } from '../../value-objects/Description.js';

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
      // Validate and normalize via VOs
      const nameRes = FileName.create(data.filename);
      const pathRes = PathVO.create(data.path);
      const mimeRes = MimeType.create(data.mimetype);
      const tagRes = TagList.create(data.tags);
      const descRes = Description.create(data.description ?? null);
      const userIdRes = UserId.create(data.userId);
      if (nameRes.isErr()) return Result.Err(nameRes.unwrapErr());
      if (pathRes.isErr()) return Result.Err(pathRes.unwrapErr());
      if (mimeRes.isErr()) return Result.Err(mimeRes.unwrapErr());
      if (tagRes.isErr()) return Result.Err(tagRes.unwrapErr());
      if (descRes.isErr()) return Result.Err(descRes.unwrapErr());
      if (userIdRes.isErr()) return Result.Err(userIdRes.unwrapErr());

      // Generate id once
      const idRes = DocumentId.create();
      if (idRes.isErr()) return Result.Err(idRes.unwrapErr());

      // Create document entity with normalized values
      const document = new Document(
        idRes.unwrap().value,
        nameRes.unwrap().value,
        mimeRes.unwrap().value,
        pathRes.unwrap().value,
        tagRes.unwrap().values,
        descRes.unwrap().value,
        userIdRes.unwrap().value,
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
      if (!Object.values(DocumentStatus).includes(data.status as DocumentStatus)) {
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