import { db } from '../../config/db.js';
import { users } from './user.schema.js';
import { IUserRepository, CreateUserData } from './user.repository.interface.js';
import { User } from '../../entities/user/User.js';
import { UserFactory } from '../../entities/user/UserFactory.js';
import { Result } from '@carbonteq/fp';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class DrizzleUserRepository implements IUserRepository {
  async createUser(data: CreateUserData): Promise<Result<User, Error>> {
    try {
      const [userRow] = await db.insert(users).values({
        id: uuidv4(),
        name: data.name,
        email: data.email,
        password_hash: data.passwordHash,
        role: data.role,
      }).returning();
      
      // Convert database row to User entity using factory
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }
      
      return Result.Ok(userResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to create user'));
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const [userRow] = await db.select().from(users).where(eq(users.email, email));
      
      if (!userRow) {
        return Result.Ok(null);
      }
      
      // Convert database row to User entity using factory
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }
      
      return Result.Ok(userResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user by email'));
    }
  }

  async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const [userRow] = await db.select().from(users).where(eq(users.id, id));
      
      if (!userRow) {
        return Result.Ok(null);
      }
      
      // Convert database row to User entity using factory
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }
      
      return Result.Ok(userResult.unwrap());
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

      const [userRow] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!userRow) {
        return Result.Err(new Error('User not found'));
      }

      // Convert database row to User entity using factory
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }

      return Result.Ok(userResult.unwrap());
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
      const userRows = await db.select().from(users);
      
      // Convert database rows to User entities using factory
      const userEntities: User[] = [];
      for (const userRow of userRows) {
        const userResult = UserFactory.fromDatabaseRow(userRow);
        if (userResult.isErr()) {
          return Result.Err(userResult.unwrapErr());
        }
        userEntities.push(userResult.unwrap());
      }
      
      return Result.Ok(userEntities);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get all users'));
    }
  }
}; 