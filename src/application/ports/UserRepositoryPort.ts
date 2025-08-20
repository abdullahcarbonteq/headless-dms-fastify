import { User } from '../../domain/entities/user/User.js';
import type { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated, AppResult } from '@carbonteq/hexapp';

export interface UserRepositoryPort {
  createUser(user: User): Promise<AppResult<User>>;
  findByEmail(email: string): Promise<AppResult<User | null>>;
  findById(id: string): Promise<AppResult<User | null>>;
  updateUser(user: User): Promise<AppResult<User>>;
  deleteUser(id: string): Promise<AppResult<boolean>>;
  getAllUsers(pagination?: HexPaginationOptions): Promise<AppResult<User[] | HexPaginated<User>>>;
}

export type { User };

