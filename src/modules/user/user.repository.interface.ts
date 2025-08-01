import { RegisterDTO } from './user.register.dto.js';
import { User } from '../../entities/user/User.js';
import { Result } from '@carbonteq/fp';

// Data types for repository operations
export type CreateUserData = Omit<RegisterDTO, 'password'> & { passwordHash: string };

export interface IUserRepository {
  /**
   * Create a new user in the store
   * @param data - User data with hashed password
   * @returns Promise<Result<User, Error>> - Success with user data or error
   */
  createUser(data: CreateUserData): Promise<Result<User, Error>>;

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
   * Update user data
   * @param id - User ID
   * @param data - Partial user data to update
   * @returns Promise<Result<User, Error>> - Success with updated user or error
   */
  updateUser(id: string, data: Partial<CreateUserData>): Promise<Result<User, Error>>;

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
  getAllUsers(): Promise<Result<User[], Error>>;
} 