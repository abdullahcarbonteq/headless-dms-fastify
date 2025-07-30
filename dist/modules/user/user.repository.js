import { db } from '../../config/db.js';
import { users } from './user.schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
export const UserRepository = {
    async createUser(data) {
        const [user] = await db.insert(users).values({
            id: uuidv4(),
            name: data.name,
            email: data.email,
            password_hash: data.passwordHash,
            role: data.role,
        }).returning();
        return user;
    },
    async findByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
};
