import { Result } from '@carbonteq/fp';
import { User } from '../../domain/entities/user/User.js';

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export interface AuthPort {
  generateToken(user: User): Promise<Result<string, Error>>;
  verifyToken(token: string): Promise<Result<JWTPayload, Error>>;
  hashPassword(password: string): Promise<Result<string, Error>>;
  comparePassword(password: string, hashedPassword: string): Promise<Result<boolean, Error>>;
  generateDownloadToken(payload: { docId: string }): Promise<Result<string, Error>>;
  verifyDownloadToken(token: string): Promise<Result<{ docId: string }, Error>>;
}

export type { User };

