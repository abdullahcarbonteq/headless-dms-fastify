import { inject, injectable } from 'tsyringe';
import { IUserRepository } from './user.repository.interface.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { RegisterDTO } from './user.register.dto.js';
import { LoginDTO } from './user.login.dto.js';
import { IUserService, User } from './user.service.interface.js';
import { Result } from '@carbonteq/fp';
import bcrypt from 'bcrypt';

@injectable()
export class UserService implements IUserService {
  private logger: ILogger;

  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') logger: ILogger
  ) {
    this.logger = logger.child({ module: 'UserService' });
  }

  async register(data: RegisterDTO): Promise<Result<User, Error>> {
    this.logger.info('Starting user registration', { email: data.email, role: data.role });
    
    // Check if user already exists
    this.logger.debug('Checking if user already exists', { email: data.email });
    const existingResult = await this.userRepository.findByEmail(data.email);
    if (existingResult.isErr()) {
      this.logger.error('Failed to check existing user', existingResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to check existing user'));
    }
    
    if (existingResult.unwrap()) {
      this.logger.warn('User registration attempted with existing email', { email: data.email });
      return Result.Err(new Error('User already exists'));
    }

    // Hash password
    this.logger.debug('Hashing password');
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    this.logger.debug('Creating new user');
    const createResult = await this.userRepository.createUser({ ...data, passwordHash });
    if (createResult.isErr()) {
      this.logger.error('Failed to create user', createResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to create user'));
    }

    const user = createResult.unwrap();
    this.logger.info('User registered successfully', { userId: user.id, email: user.email });
    return Result.Ok(user);
  }

  async login(data: LoginDTO): Promise<Result<User, Error>> {
    this.logger.info('Starting user login', { email: data.email });
    
    this.logger.debug('Finding user by email');
    const userResult = await this.userRepository.findByEmail(data.email);
    if (userResult.isErr()) {
      this.logger.error('Failed to find user during login', userResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to find user'));
    }

    const user = userResult.unwrap();
    if (!user) {
      this.logger.warn('Login attempted with non-existent email', { email: data.email });
      return Result.Err(new Error('Invalid email'));
    }

    this.logger.debug('Verifying password');
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      this.logger.warn('Login attempted with incorrect password', { email: data.email });
      return Result.Err(new Error('The Password you entered is incorrect'));
    }

    this.logger.info('User logged in successfully', { userId: user.id, email: user.email });
    return Result.Ok(user);
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    this.logger.debug('Finding user by email', { email });
    
    const userResult = await this.userRepository.findByEmail(email);
    if (userResult.isErr()) {
      this.logger.error('Failed to find user by email', userResult.unwrapErr(), { email });
      return Result.Err(new Error('Failed to find user'));
    }

    const user = userResult.unwrap();
    this.logger.debug('User lookup completed', { email, found: !!user });
    return Result.Ok(user);
  }
}
