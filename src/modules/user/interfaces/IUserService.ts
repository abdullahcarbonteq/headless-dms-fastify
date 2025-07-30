import { RegisterDTO } from '../dto/register.dto.js';
import { LoginDTO } from '../dto/login.dto.js';
import { users } from '../user.schema.js';
import { Result } from '@carbonteq/fp';

// User type based on the schema
export type User = typeof users.$inferSelect;

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
} 