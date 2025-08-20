import { inject, injectable } from 'tsyringe';
import type { AuthPort, JWTPayload } from '../../application/ports/AuthPort.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { User } from '../../domain/entities/user/User.js';
import { AppResult, AppError } from '@carbonteq/hexapp';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

@injectable()
export class JWTAuthService implements AuthPort {
  private logger: ILogger;
  private config: IConfigurationService;

  constructor(
    @inject('ILogger') logger: ILogger,
    @inject('IConfigurationService') config: IConfigurationService
  ) {
    this.logger = logger.child({ module: 'JWTAuthService' });
    this.config = config;
  }

  async generateToken(user: User): Promise<AppResult<string>> {
    try {
      this.logger.debug('Generating JWT token', { userId: user.id, email: user.email });
      
      const payload: JWTPayload = {
        userId: user.id,
        role: user.role,
        email: user.email
      };

      const token = jwt.sign(
        payload,
        this.config.jwt.secret as Secret,
        { expiresIn: this.config.jwt.expiresIn as unknown as SignOptions['expiresIn'] }
      );

      this.logger.debug('JWT token generated successfully', { userId: user.id });
      return AppResult.Ok(token);
    } catch (error) {
      this.logger.error('Failed to generate JWT token', error instanceof Error ? error : new Error('Unknown error'), { userId: user.id });
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to generate token'));
    }
  }

  async verifyToken(token: string): Promise<AppResult<JWTPayload>> {
    try {
      this.logger.debug('Verifying JWT token');
      
      const payload = jwt.verify(token, this.config.jwt.secret as Secret) as JWTPayload;
      
      this.logger.debug('JWT token verified successfully', { userId: payload.userId });
      return AppResult.Ok(payload);
    } catch (error) {
      this.logger.warn('JWT token verification failed', error instanceof Error ? error : new Error('Unknown error'));
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Invalid token'));
    }
  }

 
  async generateDownloadToken(payload: { docId: string }): Promise<AppResult<string>> {
    try {
      const token = jwt.sign(payload, this.config.jwt.secret as Secret, { expiresIn: '5m' });
      return AppResult.Ok(token);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to generate download token'));
    }
  }

  async verifyDownloadToken(token: string): Promise<AppResult<{ docId: string }>> {
    try {
      const payload = jwt.verify(token, this.config.jwt.secret as Secret) as { docId: string };
      return AppResult.Ok(payload);
    } catch (error) {
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Invalid token'));
    }
  }

  async hashPassword(password: string): Promise<AppResult<string>> {
    try {
      this.logger.debug('Hashing password');
      
      const saltRounds = 10; // Default salt rounds for bcrypt
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      this.logger.debug('Password hashed successfully');
      return AppResult.Ok(hashedPassword);
    } catch (error) {
      this.logger.error('Failed to hash password', error instanceof Error ? error : new Error('Unknown error'));
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to hash password'));
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<AppResult<boolean>> {
    try {
      this.logger.debug('Comparing passwords');
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      this.logger.debug('Password comparison completed', { isValid });
      return AppResult.Ok(isValid);
    } catch (error) {
      this.logger.error('Failed to compare passwords', error instanceof Error ? error : new Error('Unknown error'));
      return AppResult.Err(AppError.Generic(error instanceof Error ? error.message : 'Failed to compare passwords'));
    }
  }
} 