import { RegisterDTO } from './user.register.dto.js';
import { User } from '../../entities/user/User.js';
import { Result } from '@carbonteq/fp';
import { PaginationOptions, PaginatedResult } from '../../shared/dto/pagination.dto.js';

// Data types for repository operations (kept for service-level use)
export type CreateUserData = Omit<RegisterDTO, 'password'> & { passwordHash: string };

export interface IUserRepository {
  /**
   * Persist a new user entity in the store
   * @param user - User entity (fully validated)
   * @returns Promise<Result<User, Error>> - Success with user entity or error
   */
  createUser(user: User): Promise<Result<User, Error>>;

  /**
   * Find user by email address
   * @param email - User email address
   * @returns Promise<Result<User | null, Error>> - Success with user or null, or error
   */
  findByEmail(email: string): Promise<Result<User | null, Error>>;

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<Result<User | null, Error>> - Success with user or null, or error
   */
  findById(id: string): Promise<Result<User | null, Error>>;

  /**
   * Update an existing user entity
   * @param user - User entity with new state
   * @returns Promise<Result<User, Error>> - Success with updated user entity or error
   */
  updateUser(user: User): Promise<Result<User, Error>>;

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Promise<Result<boolean, Error>> - Success with deletion status or error
   */
  deleteUser(id: string): Promise<Result<boolean, Error>>;

  /**
   * Get all users
   * @returns Promise<Result<User[], Error>> - Success with all users or error
   */
  getAllUsers(pagination?: PaginationOptions): Promise<Result<User[] | PaginatedResult<User>, Error>>;
} 