import { Document, DocumentStatus } from './Document.js';
import { FileName } from '../../value-objects/FileName.js';
import { PathVO } from '../../value-objects/PathVO.js';
import { AppResult, AppError, UUID, DateTime } from '@carbonteq/hexapp';
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
  static createDocument(data: CreateDocumentData): AppResult<Document> {
    try {
      // Validate and normalize via VOs
      const nameRes = FileName.create(data.filename);
      const pathRes = PathVO.create(data.path);
      const mimeRes = MimeType.create(data.mimetype);
      const tagRes = TagList.create(data.tags);
      const descRes = Description.create(data.description ?? null);
      const userIdRes = UserId.create(data.userId);
      if (nameRes.isErr()) return AppResult.Err(AppError.Generic(nameRes.unwrapErr().message));
      if (pathRes.isErr()) return AppResult.Err(AppError.Generic(pathRes.unwrapErr().message));
      if (mimeRes.isErr()) return AppResult.Err(AppError.Generic(mimeRes.unwrapErr().message));
      if (tagRes.isErr()) return AppResult.Err(AppError.Generic(tagRes.unwrapErr().message));
      if (descRes.isErr()) return AppResult.Err(AppError.Generic(descRes.unwrapErr().message));
      if (userIdRes.isErr()) return AppResult.Err(AppError.Generic(userIdRes.unwrapErr().message));

      // Generate id once
      const idRes = DocumentId.create();
      if (idRes.isErr()) return AppResult.Err(AppError.Generic(idRes.unwrapErr().message));

      // Create document entity with normalized values
      const document = new Document(
        UUID.fromTrusted(idRes.unwrap().value),
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
        return AppResult.Err(AppError.Generic('Created document is invalid'));
      }

      return AppResult.Ok(document);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to create document'));
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
  }): AppResult<Document> {
    try {
      // Validate status
      if (!Object.values(DocumentStatus).includes(data.status as DocumentStatus)) {
        return AppResult.Err(AppError.Generic('Invalid document status'));
      }

      // Create document entity with hexapp types
      const document = new Document(
        UUID.fromTrusted(data.id),
        data.filename,
        data.mimetype,
        data.path,
        data.tags,
        data.description,
        data.userId,
        data.status as DocumentStatus,
        data.createdAt ? DateTime.from(data.createdAt) : undefined,
        data.updatedAt ? DateTime.from(data.updatedAt) : undefined
      );

      // Validate the created entity
      if (!document.validate()) {
        return AppResult.Err(AppError.Generic('Created document is invalid'));
      }

      return AppResult.Ok(document);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to create document'));
    }
  }

  /**
   * Create a document entity from database row
   */
  static fromDatabaseRow(row: any): AppResult<Document> {
    try {
      // Validate required fields
      if (!row.id || !row.filename || !row.mimetype || !row.path) {
        return AppResult.Err(AppError.Generic('Missing required document fields'));
      }

      // Get userId from either property name or column name
      const userId = row.userId || row.user_id;
      if (!userId) {
        return AppResult.Err(AppError.Generic('Missing userId in document data'));
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

      // Create document entity with hexapp types
      const document = new Document(
        UUID.fromTrusted(row.id),
        row.filename,
        row.mimetype,
        row.path,
        tags,
        row.description || null,
        userId,
        row.status || DocumentStatus.ACTIVE,
        row.createdAt ? DateTime.from(new Date(row.createdAt)) : row.created_at ? DateTime.from(new Date(row.created_at)) : undefined,
        row.updatedAt ? DateTime.from(new Date(row.updatedAt)) : row.updated_at ? DateTime.from(new Date(row.updated_at)) : undefined
      );

      // Validate the created entity
      if (!document.validate()) {
        return AppResult.Err(AppError.Generic('Invalid document data from database'));
      }

      return AppResult.Ok(document);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to create document from database row'));
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
  static fromDatabaseRows(rows: any[]): AppResult<Document[]> {
    const documents: Document[] = [];

    for (const row of rows) {
      const documentResult = this.fromDatabaseRow(row);
      if (documentResult.isErr()) {
        return AppResult.Err(AppError.Generic(documentResult.unwrapErr().message));
      }
      documents.push(documentResult.unwrap());
    }

    return AppResult.Ok(documents);
  }
} 