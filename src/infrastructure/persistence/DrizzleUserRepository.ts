import { db } from './db.js';
import { users } from './schemas/user.schema.js';
import type { UserRepositoryPort } from '../../application/ports/UserRepositoryPort.js';
import { User } from '../../domain/entities/user/User.js';
import { UserFactory } from '../../domain/entities/user/UserFactory.js';
import { AppResult, AppError } from '@carbonteq/hexapp';
import { eq, sql } from 'drizzle-orm';
import type { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated } from '@carbonteq/hexapp';
import { injectable } from 'tsyringe';

@injectable()
export class DrizzleUserRepository implements UserRepositoryPort {
  async createUser(user: User): Promise<AppResult<User>> {
    try {
      const [userRow] = await db.insert(users).values({
        id: user.id,
        name: user.name,
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role,
      }).returning();
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) {
        return AppResult.Err(AppError.Generic(userResult.unwrapErr().message));
      }
      return AppResult.Ok(userResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to create user'));
    }
  }

  async findByEmail(email: string): Promise<AppResult<User | null>> {
    try {
      const [userRow] = await db.select().from(users).where(eq(users.email, email));
      if (!userRow) return AppResult.Ok(null);
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) return AppResult.Err(AppError.Generic(userResult.unwrapErr().message));
      return AppResult.Ok(userResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to find user by email'));
    }
  }

  async findById(id: string): Promise<AppResult<User | null>> {
    try {
      const [userRow] = await db.select().from(users).where(eq(users.id, id));
      if (!userRow) return AppResult.Ok(null);
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) return AppResult.Err(AppError.Generic(userResult.unwrapErr().message));
      return AppResult.Ok(userResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to find user by ID'));
    }
  }

  async updateUser(user: User): Promise<AppResult<User>> {
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
      if (!userRow) return AppResult.Err(AppError.NotFound('User not found'));
      const userResult = UserFactory.fromDatabaseRow(userRow);
      if (userResult.isErr()) return AppResult.Err(AppError.Generic(userResult.unwrapErr().message));
      return AppResult.Ok(userResult.unwrap());
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to update user'));
    }
  }

  async deleteUser(id: string): Promise<AppResult<boolean>> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      const deleted = (result.rowCount ?? 0) > 0;
      return AppResult.Ok(deleted);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to delete user'));
    }
  }

  async getAllUsers(pagination?: HexPaginationOptions): Promise<AppResult<User[] | HexPaginated<User>>> {
    try {
      if (pagination) {
        const offset = (pagination.pageNum - 1) * pagination.pageSize;
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);
        const total = Number(count);
        const rows = await db
          .select()
          .from(users)
          .limit(pagination.pageSize)
          .offset(offset);
        const entitiesResult = UserFactory.fromDatabaseRows(rows);
        if (entitiesResult.isErr()) return AppResult.Err(AppError.Generic(entitiesResult.unwrapErr().message));
        const totalPages = Math.ceil(total / pagination.pageSize);
        const result: HexPaginated<User> = {
          data: entitiesResult.unwrap(),
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
          totalPages,
        };
        return AppResult.Ok(result);
      } else {
        const userRows = await db.select().from(users);
        const entitiesResult = UserFactory.fromDatabaseRows(userRows);
        if (entitiesResult.isErr()) return AppResult.Err(AppError.Generic(entitiesResult.unwrapErr().message));
        return AppResult.Ok(entitiesResult.unwrap());
      }
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to get all users'));
    }
  }
}

