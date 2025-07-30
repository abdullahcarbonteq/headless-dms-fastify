import { RegisterDTO } from '../dto/register.dto.js';
import { users } from '../user.schema.js';
import { Result } from '@carbonteq/fp';

// User type based on the schema
export type User = typeof users.$inferSelect;

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

  // TODO: Uncomment in cleanup phase when user management endpoints are added
  /*
  findById(id: string): Promise<Result<User | null, Error>>;
  updateUser(id: string, data: Partial<CreateUserData>): Promise<Result<User, Error>>;
  deleteUser(id: string): Promise<Result<boolean, Error>>;
  getAllUsers(): Promise<Result<User[], Error>>;
  */
} 