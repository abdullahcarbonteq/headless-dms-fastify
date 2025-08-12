import { db } from './db.js';
import { documents } from './schemas/document.schema.js';
import type { DocumentRepositoryPort } from '../../application/ports/DocumentRepositoryPort.js';
import { Result } from '@carbonteq/fp';
import { eq, like, ilike, and, or, sql } from 'drizzle-orm';
import { DocumentFactory } from '../../domain/entities/document/DocumentFactory.js';
import { Document } from '../../domain/entities/document/Document.js';
import { injectable } from 'tsyringe';

@injectable()
export class DrizzleDocumentRepository implements DocumentRepositoryPort {
  async createDocument(docEntity: Document): Promise<Result<Document, Error>> {
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
      if (documentResult.isErr()) return Result.Err(documentResult.unwrapErr());
      return Result.Ok(documentResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create document'));
    }
  }

  async findById(id: string): Promise<Result<Document | null, Error>> {
    try {
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));
      if (!doc) return Result.Ok(null);
      const documentResult = DocumentFactory.fromDatabaseRow(doc);
      if (documentResult.isErr()) return Result.Err(documentResult.unwrapErr());
      return Result.Ok(documentResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find document by ID'));
    }
  }

  async getAllDocuments(pagination?: { page: number; limit: number }): Promise<Result<Document[] | { data: Document[]; total: number; page: number; limit: number; totalPages: number }, Error>> {
    try {
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(documents);
        const total = Number(count);
        const docs = await db.select().from(documents).limit(pagination.limit).offset(offset);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return Result.Err(documentEntitiesResult.unwrapErr());
        return Result.Ok({
          data: documentEntitiesResult.unwrap(),
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        });
      } else {
        const docs = await db.select().from(documents);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return Result.Err(documentEntitiesResult.unwrapErr());
        return Result.Ok(documentEntitiesResult.unwrap());
      }
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get all documents'));
    }
  }

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await db.delete(documents).where(eq(documents.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      return Result.Ok(deleted);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  }

  async searchDocuments(criteria: { tags?: string[]; description?: string; userId?: string }, pagination?: { page: number; limit: number }): Promise<Result<Document[] | { data: Document[]; total: number; page: number; limit: number; totalPages: number }, Error>> {
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
        const offset = (pagination.page - 1) * pagination.limit;
        const totalRow = whereClause
          ? await db.select({ count: sql<number>`count(*)` }).from(documents).where(whereClause)
          : await db.select({ count: sql<number>`count(*)` }).from(documents);
        const total = Number(totalRow[0]?.count ?? 0);
        const query = db.select().from(documents);
        const docs = whereClause
          ? await query.where(whereClause).limit(pagination.limit).offset(offset)
          : await query.limit(pagination.limit).offset(offset);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return Result.Err(documentEntitiesResult.unwrapErr());
        return Result.Ok({
          data: documentEntitiesResult.unwrap(),
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        });
      } else {
        const docs = whereClause ? await db.select().from(documents).where(whereClause) : await db.select().from(documents);
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) return Result.Err(documentEntitiesResult.unwrapErr());
        return Result.Ok(documentEntitiesResult.unwrap());
      }
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  }

  async updateDocument(document: Document): Promise<Result<Document, Error>> {
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
      if (entityResult.isErr()) return Result.Err(entityResult.unwrapErr());
      return Result.Ok(entityResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to update document'));
    }
  }
}

