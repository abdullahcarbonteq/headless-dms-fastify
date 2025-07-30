import { db } from '../../../config/db.js';
import { users } from '../user.schema.js';
import { IUserRepository, User, CreateUserData } from '../interfaces/IUserRepository.js';
import { Result } from '@carbonteq/fp';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class DrizzleUserRepository implements IUserRepository {
  async createUser(data: CreateUserData): Promise<Result<User, Error>> {
    try {
      const [user] = await db.insert(users).values({
        id: uuidv4(),
        name: data.name,
        email: data.email,
        password_hash: data.passwordHash,
        role: data.role,
      }).returning();
      
      return Result.Ok(user);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create user'));
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return Result.Ok(user || null);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user by email'));
    }
  }

  // TODO: Implement in cleanup phase when user management endpoints are added
  /*
  async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return Result.Ok(user || null);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user by ID'));
    }
  }

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<Result<User, Error>> {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.passwordHash) updateData.password_hash = data.passwordHash;
      if (data.role) updateData.role = data.role;

      const [user] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!user) {
        return Result.Err(new Error('User not found'));
      }

      return Result.Ok(user);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to update user'));
    }
  }

  async deleteUser(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      return Result.Ok(deleted);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to delete user'));
    }
  }

  async getAllUsers(): Promise<Result<User[], Error>> {
    try {
      const allUsers = await db.select().from(users);
      return Result.Ok(allUsers);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get all users'));
    }
  }
  */
}; 