import { Result } from '@carbonteq/fp';
import { User } from '../../domain/entities/user/User.js';
import type { PaginationOptions, PaginatedResult } from '../../shared/dto/pagination.dto.js';

export interface UserRepositoryPort {
  createUser(user: User): Promise<Result<User, Error>>;
  findByEmail(email: string): Promise<Result<User | null, Error>>;
  findById(id: string): Promise<Result<User | null, Error>>;
  updateUser(user: User): Promise<Result<User, Error>>;
  deleteUser(id: string): Promise<Result<boolean, Error>>;
  getAllUsers(pagination?: PaginationOptions): Promise<Result<User[] | PaginatedResult<User>, Error>>;
}

export type { User };

