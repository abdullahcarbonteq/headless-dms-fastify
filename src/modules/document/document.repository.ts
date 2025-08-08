import { db } from '../../config/db.js';
import { documents } from './document.schema.js';
import { IDocumentRepository, Document, DocumentSearchCriteria, PaginationOptions, PaginatedResult } from './document.repository.interface.js';
import { Result } from '@carbonteq/fp';
import { eq, like, ilike, and, or, sql } from 'drizzle-orm';
import { DocumentFactory } from '../../entities/document/DocumentFactory.js';

export class DrizzleDocumentRepository implements IDocumentRepository {
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
      
      // Convert database row to Document entity
      const documentResult = DocumentFactory.fromDatabaseRow(doc);
      if (documentResult.isErr()) {
        return Result.Err(documentResult.unwrapErr());
      }
      
      return Result.Ok(documentResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create document'));
    }
  }

  async findById(id: string): Promise<Result<Document | null, Error>> {
    try {
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));
      if (!doc) {
        return Result.Ok(null);
      }
      
      // Convert database row to Document entity
      const documentResult = DocumentFactory.fromDatabaseRow(doc);
      if (documentResult.isErr()) {
        return Result.Err(documentResult.unwrapErr());
      }
      
      return Result.Ok(documentResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find document by ID'));
    }
  }

  async getAllDocuments(pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    try {
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        
        // Get total count
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(documents);
        const total = Number(count);
        
        // Get paginated data
        const docs = await db.select()
          .from(documents)
          .limit(pagination.limit)
          .offset(offset);
        
          //same as above
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) {
          return Result.Err(documentEntitiesResult.unwrapErr());
        }
        
        const paginatedResult: PaginatedResult<Document> = {
          data: documentEntitiesResult.unwrap(),
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit)
        };
        
        return Result.Ok(paginatedResult);
      } else {
        const docs = await db.select().from(documents);
        
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) {
          return Result.Err(documentEntitiesResult.unwrapErr());
        }
        
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

  async updateDocument(document: Document): Promise<Result<Document, Error>> {
    try {
      const [row] = await db
        .update(documents)
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

  async searchDocuments(criteria: DocumentSearchCriteria, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    try {
      let whereClause = undefined;

      
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
        
        // Get total count with search criteria
        const totalRow = whereClause 
          ? await db.select({ count: sql<number>`count(*)` }).from(documents).where(whereClause)
          : await db.select({ count: sql<number>`count(*)` }).from(documents);
        const total = Number(totalRow[0]?.count ?? 0);
        
        // Get paginated data with search criteria
        const query = db.select().from(documents);
        const docs = whereClause 
          ? await query.where(whereClause).limit(pagination.limit).offset(offset)
          : await query.limit(pagination.limit).offset(offset);
        
        // Convert database rows to Document entities
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) {
          return Result.Err(documentEntitiesResult.unwrapErr());
        }
        
        const paginatedResult: PaginatedResult<Document> = {
          data: documentEntitiesResult.unwrap(),
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit)
        };
        
        return Result.Ok(paginatedResult);
      } else {
        const docs = whereClause 
          ? await db.select().from(documents).where(whereClause)
          : await db.select().from(documents);
        
        // Convert database rows to Document entities
        const documentEntitiesResult = DocumentFactory.fromDatabaseRows(docs);
        if (documentEntitiesResult.isErr()) {
          return Result.Err(documentEntitiesResult.unwrapErr());
        }
        
        return Result.Ok(documentEntitiesResult.unwrap());
      }
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
    }
  }

  
} 