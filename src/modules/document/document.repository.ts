import { db } from '@/config/db';
import { documents } from './document.schema';
import { InsertDocumentDTO } from './document.dto';
import { v4 as uuidv4 } from 'uuid';
import { eq, like, ilike, and, or } from 'drizzle-orm';

export const DocumentRepository = {
  async create(data: InsertDocumentDTO) {
    const [doc] = await db.insert(documents).values({
      id: uuidv4(),
      ...data,
    }).returning();
    return doc;
  },
  async getAll() {
    return db.select().from(documents);
  },
  async deleteById(id: string) {
    return db.delete(documents).where(eq(documents.id, id));
  },
  async search({ tags, description }: { tags?: string[]; description?: string }) {
    let whereClause = undefined;

    if (tags && tags.length > 0) {
      // Build an OR clause for tags
      const tagClauses = tags.map(tag => like(documents.tags, `%${tag}%`));
      whereClause = or(...tagClauses);
    }

    if (description) {
      const descClause = ilike(documents.description, `%${description}%`);
      whereClause = whereClause ? and(whereClause, descClause) : descClause;
    }

    return db.select().from(documents).where(whereClause);
  },
};
