import { db } from '../../config/db.js';
import { documents } from './document.schema.js';
import { IDocumentRepository, Document, DocumentSearchCriteria, PaginationOptions, PaginatedResult } from './document.repository.interface.js';
import { Result } from '@carbonteq/fp';
import { eq, like, ilike, and, or } from 'drizzle-orm';
import { DocumentFactory } from '../../entities/document/DocumentFactory.js';

export class DrizzleDocumentRepository implements IDocumentRepository {
  async createDocument(data: any): Promise<Result<Document, Error>> {
    try {
      const [doc] = await db.insert(documents).values({
        id: data.id || crypto.randomUUID(),
        filename: data.filename,
        mimetype: data.mimetype,
        path: data.path,
        tags: data.tags,
        description: data.description,
        userId: data.userId,
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
        const totalResult = await db.select({ count: documents.id }).from(documents);
        const total = totalResult.length;
        
        // Get paginated data
        const docs = await db.select()
          .from(documents)
          .limit(pagination.limit)
          .offset(offset);
        
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
        const docs = await db.select().from(documents);
        
        // Convert database rows to Document entities
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

  // TODO: Implement in cleanup phase when document update endpoint is added
  /*
  async updateDocument(id: string, data: Partial<any>): Promise<Result<Document, Error>> {
    try {
      const updateData: any = {};
      if (data.filename) updateData.filename = data.filename;
      if (data.mimetype) updateData.mimetype = data.mimetype;
      if (data.path) updateData.path = data.path;
      if (data.tags) updateData.tags = data.tags;
      if (data.description) updateData.description = data.description;
      if (data.userId) updateData.userId = data.userId;

      const [doc] = await db.update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();

      if (!doc) {
        return Result.Err(new Error('Document not found'));
      }

      return Result.Ok(doc);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to update document'));
    }
  }
  */

  async deleteDocument(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await db.delete(documents).where(eq(documents.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      return Result.Ok(deleted);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
    }
  }

  async searchDocuments(criteria: DocumentSearchCriteria, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    try {
      let whereClause = undefined;

      // Build search conditions
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
        const totalResult = whereClause 
          ? await db.select({ count: documents.id }).from(documents).where(whereClause)
          : await db.select({ count: documents.id }).from(documents);
        const total = totalResult.length;
        
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

  // TODO: Implement in cleanup phase when user-specific document listing endpoint is added
  /*
  async getDocumentsByUserId(userId: string, pagination?: PaginationOptions): Promise<Result<Document[] | PaginatedResult<Document>, Error>> {
    try {
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        
        // Get total count for user
        const totalResult = await db.select({ count: documents.id })
          .from(documents)
          .where(eq(documents.userId, userId));
        const total = totalResult.length;
        
        // Get paginated data for user
        const docs = await db.select()
          .from(documents)
          .where(eq(documents.userId, userId))
          .limit(pagination.limit)
          .offset(offset);
        
        const paginatedResult: PaginatedResult<Document> = {
          data: docs,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit)
        };
        
        return Result.Ok(paginatedResult);
      } else {
        const docs = await db.select()
          .from(documents)
          .where(eq(documents.userId, userId));
        return Result.Ok(docs);
      }
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get documents by user ID'));
    }
  }
  */
} 