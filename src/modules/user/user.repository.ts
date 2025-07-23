import { db } from '@/config/db'
import { users } from './user.schema';
import { RegisterDTO } from './dto/register.dto';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const UserRepository = {
  async createUser(data: Omit<RegisterDTO, 'password'> & { passwordHash: string }) {
    const [user] = await db.insert(users).values({
      id: uuidv4(),
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    }).returning();
    return user;
  },

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
};
