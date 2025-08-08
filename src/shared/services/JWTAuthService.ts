import { inject, injectable } from 'tsyringe';
import { IAuthService, JWTPayload } from '../interfaces/IAuthService.js';
import { ILogger } from '../interfaces/ILogger.js';
import { IConfigurationService } from '../interfaces/IConfigurationService.js';
import { User } from '../../entities/user/User.js';
import { Result } from '@carbonteq/fp';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';

@injectable()
export class JWTAuthService implements IAuthService {
  private logger: ILogger;
  private config: IConfigurationService;

  constructor(
    @inject('ILogger') logger: ILogger,
    @inject('IConfigurationService') config: IConfigurationService
  ) {
    this.logger = logger.child({ module: 'JWTAuthService' });
    this.config = config;
  }

  async generateToken(user: User): Promise<Result<string, Error>> {
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
      return Result.Ok(token);
    } catch (error) {
      this.logger.error('Failed to generate JWT token', error instanceof Error ? error : new Error('Unknown error'), { userId: user.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to generate token'));
    }
  }

  async verifyToken(token: string): Promise<Result<JWTPayload, Error>> {
    try {
      this.logger.debug('Verifying JWT token');
      
      const payload = jwt.verify(token, this.config.jwt.secret as Secret) as JWTPayload;
      
      this.logger.debug('JWT token verified successfully', { userId: payload.userId });
      return Result.Ok(payload);
    } catch (error) {
      this.logger.warn('JWT token verification failed', error instanceof Error ? error : new Error('Unknown error'));
      return Result.Err(error instanceof Error ? error : new Error('Invalid token'));
    }
  }

  /**
   * Generate a short-lived download token for a document
   */
  async generateDownloadToken(payload: { docId: string }): Promise<Result<string, Error>> {
    try {
      const token = jwt.sign(payload, this.config.jwt.secret as Secret, { expiresIn: '5m' });
      return Result.Ok(token);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to generate download token'));
    }
  }

  async verifyDownloadToken(token: string): Promise<Result<{ docId: string }, Error>> {
    try {
      const payload = jwt.verify(token, this.config.jwt.secret as Secret) as { docId: string };
      return Result.Ok(payload);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Invalid token'));
    }
  }

  async hashPassword(password: string): Promise<Result<string, Error>> {
    try {
      this.logger.debug('Hashing password');
      
      const saltRounds = 10; // Default salt rounds for bcrypt
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      this.logger.debug('Password hashed successfully');
      return Result.Ok(hashedPassword);
    } catch (error) {
      this.logger.error('Failed to hash password', error instanceof Error ? error : new Error('Unknown error'));
      return Result.Err(error instanceof Error ? error : new Error('Failed to hash password'));
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<Result<boolean, Error>> {
    try {
      this.logger.debug('Comparing passwords');
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      this.logger.debug('Password comparison completed', { isValid });
      return Result.Ok(isValid);
    } catch (error) {
      this.logger.error('Failed to compare passwords', error instanceof Error ? error : new Error('Unknown error'));
      return Result.Err(error instanceof Error ? error : new Error('Failed to compare passwords'));
    }
  }
} 