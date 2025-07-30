import { db } from '../../config/db.js';
import { documents } from './document.schema.js';
import { v4 as uuidv4 } from 'uuid';
import { eq, like, ilike, and, or } from 'drizzle-orm';
export const DocumentRepository = {
    async create(data) {
        const [doc] = await db.insert(documents).values({
            id: uuidv4(),
            filename: data.filename,
            mimetype: data.mimetype,
            path: data.path,
            tags: data.tags,
            description: data.description,
            userId: data.userId,
        }).returning();
        return doc;
    },
    async getAll() {
        return db.select().from(documents);
    },
    async deleteById(id) {
        return db.delete(documents).where(eq(documents.id, id));
    },
    async search({ tags, description }) {
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
