import { db } from '../../config/db.js';
import { users } from './user.schema.js';
import { IUserRepository } from './user.repository.interface.js';
import { User } from '../../entities/user/User.js';
import { UserFactory } from '../../entities/user/UserFactory.js';
import { Result } from '@carbonteq/fp';
import { eq, sql } from 'drizzle-orm';
import { PaginationOptions, PaginatedResult } from '../../shared/dto/pagination.dto.js';
import { v4 as uuidv4 } from 'uuid';

export class DrizzleUserRepository implements IUserRepository {
  async createUser(user: User): Promise<Result<User, Error>> {
    try {
      const [userRow] = await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role,
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
      
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }
      
      return Result.Ok(userResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user by ID'));
    }
  }

  async updateUser(user: User): Promise<Result<User, Error>> {
    try {
      const updateData: any = {
        name: user.name,
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role,
      };

      const [userRow] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      if (!userRow) {
        return Result.Err(new Error('User not found'));
      }

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

  async getAllUsers(pagination?: PaginationOptions): Promise<Result<User[] | PaginatedResult<User>, Error>> {
    try {
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);
        const total = Number(count);

        const rows = await db
          .select()
          .from(users)
          .limit(pagination.limit)
          .offset(offset);

        const entitiesResult = UserFactory.fromDatabaseRows(rows);
        if (entitiesResult.isErr()) {
          return Result.Err(entitiesResult.unwrapErr());
        }

        const result: PaginatedResult<User> = {
          data: entitiesResult.unwrap(),
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(total / pagination.limit),
        };
        return Result.Ok(result);
      } else {
        const userRows = await db.select().from(users);
        const entitiesResult = UserFactory.fromDatabaseRows(userRows);
        if (entitiesResult.isErr()) {
          return Result.Err(entitiesResult.unwrapErr());
        }
        return Result.Ok(entitiesResult.unwrap());
      }
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to get all users'));
    }
  }
}; 