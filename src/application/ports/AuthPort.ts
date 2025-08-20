import { User } from '../../domain/entities/user/User.js';
import type { AppResult } from '@carbonteq/hexapp';

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export interface AuthPort {
  generateToken(user: User): Promise<AppResult<string>>;
  verifyToken(token: string): Promise<AppResult<JWTPayload>>;
  hashPassword(password: string): Promise<AppResult<string>>;
  comparePassword(password: string, hashedPassword: string): Promise<AppResult<boolean>>;
  generateDownloadToken(payload: { docId: string }): Promise<AppResult<string>>;
  verifyDownloadToken(token: string): Promise<AppResult<{ docId: string }>>;
}

export type { User };

