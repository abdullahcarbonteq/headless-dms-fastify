import { db } from './db.js';
import { documents } from './schemas/document.schema.js';
import type { DocumentRepositoryPort } from '../../application/ports/DocumentRepositoryPort.js';
import { eq, like, ilike, and, or, sql } from 'drizzle-orm';
import { DocumentFactory } from '../../domain/entities/document/DocumentFactory.js';
import { Document } from '../../domain/entities/document/Document.js';
import { injectable } from 'tsyringe';
import { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated, AppResult, AppError } from '@carbonteq/hexapp';
//import { Result } from 'pg';

@injectable()
export class DrizzleDocumentRepository implements DocumentRepositoryPort {
  async createDocument(docEntity: Document): Promise<AppResult<Document>> {
    try {
      const [doc] = await db.insert(documents).values({
        id: docEntity.id,
        filename: docEntity.filename,
        mimetype: docEntity.mimetype,
        path: docEntity.path,
        tags: JSON.stringify(docEntity.tags),
        description: docEntity.description,
        userId: docEntity.userId,
      }).returning();
      const documentResult = DocumentFactory.fromDatabaseRow(doc);
      if (documentResult.isErr()) return AppResult.Err(AppError.Generic('Failed to create document from database row'));
      return AppResult.Ok(documentResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to create document'));
    }
  }

  async findById(id: string): Promise<AppResult<Document | null>> {
    try {
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));
      if (!doc) return AppResult.Ok(null);
      const documentResult = DocumentFactory.fromDatabaseRow(doc);
      if (documentResult.isErr()) return AppResult.Err(AppError.Generic('Failed to create document from database row'));
      return AppResult.Ok(documentResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to find document by ID'));
    }
  }

  async getAllDocuments(pagination?: HexPaginationOptions): Promise<AppResult<Document[] | HexPaginated<Document>>> {
    try {
      if (pagination) {
        const offset = (pagination.pageNum - 1) * pagination.pageSize;
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(documents);
        const total = Number(count);
        const docs = await db.select().from(documents).limit(pagination.pageSize).offset(offset);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return AppResult.Err(documentEntitiesResult.unwrapErr());
        const totalPages = Math.ceil(total / pagination.pageSize);
        const result: HexPaginated<Document> = {
          data: documentEntitiesResult.unwrap(),
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
          totalPages,
        };
        return AppResult.Ok(result);
      } else {
        const docs = await db.select().from(documents);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return AppResult.Err(AppError.Generic('Failed to create documents from database rows'));
        return AppResult.Ok(documentEntitiesResult.unwrap());
      }
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to get all documents'));
    }
  }

  async deleteDocument(id: string): Promise<AppResult<boolean>> {
    try {
      const result = await db.delete(documents).where(eq(documents.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      return AppResult.Ok(deleted);
    } catch (error) {
      return AppResult.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  }

  async searchDocuments(criteria: { tags?: string[]; description?: string; userId?: string }, pagination?: HexPaginationOptions): Promise<AppResult<Document[] | HexPaginated<Document>>> {
    try {
      let whereClause = undefined as any;
      if (criteria.tags && criteria.tags.length > 0) {
        const tagClauses = criteria.tags.map(tag => like(documents.tags, `%${tag}%`));
        whereClause = or(...tagClauses);
      }
      if (criteria.description) {
        const descClause = ilike(documents.description, `%${criteria.description}%`);
        whereClause = whereClause ? and(whereClause, descClause) : descClause;
      }
      if (criteria.userId) {
        const userClause = eq(documents.userId, criteria.userId);
        whereClause = whereClause ? and(whereClause, userClause) : userClause;
      }

      if (pagination) {
        const offset = (pagination.pageNum - 1) * pagination.pageSize;
        const totalRow = whereClause
          ? await db.select({ count: sql<number>`count(*)` }).from(documents).where(whereClause)
          : await db.select({ count: sql<number>`count(*)` }).from(documents);
        const total = Number(totalRow[0]?.count ?? 0);
        const query = db.select().from(documents);
        const docs = whereClause
          ? await query.where(whereClause).limit(pagination.pageSize).offset(offset)
          : await query.limit(pagination.pageSize).offset(offset);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return AppResult.Err(documentEntitiesResult.unwrapErr());
        const totalPages = Math.ceil(total / pagination.pageSize);
        const result: HexPaginated<Document> = {
          data: documentEntitiesResult.unwrap(),
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
          totalPages,
        };
        return AppResult.Ok(result);
      } else {
        const docs = whereClause ? await db.select().from(documents).where(whereClause) : await db.select().from(documents);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return AppResult.Err(documentEntitiesResult.unwrapErr());
        return AppResult.Ok(documentEntitiesResult.unwrap());
      }
    } catch (error) {
      return AppResult.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  }

  async updateDocument(document: Document): Promise<AppResult<Document>> {
    try {
      const [row] = await db.update(documents)
        .set({
          filename: document.filename,
          mimetype: document.mimetype,
          path: document.path,
          tags: JSON.stringify(document.tags),
          description: document.description,
          userId: document.userId,
        })
        .where(eq(documents.id, document.id))
        .returning();
      const entityResult = DocumentFactory.fromDatabaseRow(row);
      if (entityResult.isErr()) return AppResult.Err(entityResult.unwrapErr());
      return AppResult.Ok(entityResult.unwrap());
    } catch (error) {
      return AppResult.Err(error instanceof Error ? error : new Error('Failed to update document'));
    }
  }
}

