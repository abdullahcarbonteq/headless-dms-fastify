import { db } from '@/config/db';
import { documents } from './document.schema';
import { InsertDocumentDTO } from './document.dto';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

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
};
