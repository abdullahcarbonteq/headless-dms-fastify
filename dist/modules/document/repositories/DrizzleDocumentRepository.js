import { db } from '../../../config/db.js';
import { documents } from '../document.schema.js';
import { Result } from '@carbonteq/fp';
import { eq, like, ilike, and, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
export class DrizzleDocumentRepository {
    async createDocument(data) {
        try {
            const [doc] = await db.insert(documents).values({
                id: uuidv4(),
                filename: data.filename,
                mimetype: data.mimetype,
                path: data.path,
                tags: data.tags,
                description: data.description,
                userId: data.userId,
            }).returning();
            return Result.Ok(doc);
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to create document'));
        }
    }
    async findById(id) {
        try {
            const [doc] = await db.select().from(documents).where(eq(documents.id, id));
            return Result.Ok(doc || null);
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to find document by ID'));
        }
    }
    async getAllDocuments(pagination) {
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
                const paginatedResult = {
                    data: docs,
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit)
                };
                return Result.Ok(paginatedResult);
            }
            else {
                const docs = await db.select().from(documents);
                return Result.Ok(docs);
            }
        }
        catch (error) {
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
    async deleteDocument(id) {
        try {
            const result = await db.delete(documents).where(eq(documents.id, id));
            const deleted = (result.rowCount ?? 0) > 0;
            return Result.Ok(deleted);
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to delete document'));
        }
    }
    async searchDocuments(criteria, pagination) {
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
                const paginatedResult = {
                    data: docs,
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit)
                };
                return Result.Ok(paginatedResult);
            }
            else {
                const docs = whereClause
                    ? await db.select().from(documents).where(whereClause)
                    : await db.select().from(documents);
                return Result.Ok(docs);
            }
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to search documents'));
        }
    }
}
