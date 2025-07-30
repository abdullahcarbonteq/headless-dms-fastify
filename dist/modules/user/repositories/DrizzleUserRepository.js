import { db } from '../../../config/db.js';
import { users } from '../user.schema.js';
import { Result } from '@carbonteq/fp';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
export class DrizzleUserRepository {
    async createUser(data) {
        try {
            const [user] = await db.insert(users).values({
                id: uuidv4(),
                name: data.name,
                email: data.email,
                password_hash: data.passwordHash,
                role: data.role,
            }).returning();
            return Result.Ok(user);
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to create user'));
        }
    }
    async findByEmail(email) {
        try {
            const [user] = await db.select().from(users).where(eq(users.email, email));
            return Result.Ok(user || null);
        }
        catch (error) {
            return Result.Err(error instanceof Error ? error : new Error('Failed to find user by email'));
        }
    }
}
;
