import { RegisterDTO } from './user.register.dto.js';
import { LoginDTO } from './user.login.dto.js';
import { User } from '../../entities/user/User.js';
import { Result } from '@carbonteq/fp';

export interface IUserService {
  /**
   * Register a new user
   * @param data - User registration data
   * @returns Promise<Result<User, Error>> - Success with user data or error
   */
  register(data: RegisterDTO): Promise<Result<User, Error>>;

  /**
   * Authenticate user login
   * @param data - User login credentials
   * @returns Promise<Result<User, Error>> - Success with user data or error
   */
  login(data: LoginDTO): Promise<Result<User, Error>>;

  /**
   * Find user by email
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
   * Get all users
   * @returns Promise<Result<User[], Error>> - Success with all users or error
   */
  getAllUsers(): Promise<Result<User[], Error>>;

  /**
   * Update user information
   * @param id - User ID
   * @param data - User data to update
   * @returns Promise<Result<User, Error>> - Success with updated user or error
   */
  updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }): Promise<Result<User, Error>>;

  /**
   * Delete user by ID
   * @param id - User ID to delete
   * @param requestingUserId - ID of the user making the request (for authorization)
   * @returns Promise<Result<boolean, Error>> - Success with deletion status or error
   */
  deleteUser(id: string, requestingUserId: string): Promise<Result<boolean, Error>>;
} 