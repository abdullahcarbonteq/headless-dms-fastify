import { Result } from '@carbonteq/fp';
import { User } from '../../domain/entities/user/User.js';

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export interface IAuthService {
  /**
   * Generate JWT token for a user
   * @param user - User entity
   * @returns Promise<Result<string, Error>> - Success with JWT token or error
   */
  generateToken(user: User): Promise<Result<string, Error>>;

  /**
   * Verify JWT token and extract payload
   * @param token - JWT token string
   * @returns Promise<Result<JWTPayload, Error>> - Success with payload or error
   */
  verifyToken(token: string): Promise<Result<JWTPayload, Error>>;

  /**
   * Hash password using secure algorithm
   * @param password - Plain text password
   * @returns Promise<Result<string, Error>> - Success with hashed password or error
   */
  hashPassword(password: string): Promise<Result<string, Error>>;

  /**
   * Compare plain text password with hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<Result<boolean, Error>> - Success with comparison result or error
   */
  comparePassword(password: string, hashedPassword: string): Promise<Result<boolean, Error>>;

  /**
   * Generate a short-lived download token for documents
   */
  generateDownloadToken(payload: { docId: string }): Promise<Result<string, Error>>;

  /**
   * Verify short-lived download token
   */
  verifyDownloadToken(token: string): Promise<Result<{ docId: string }, Error>>;
} 