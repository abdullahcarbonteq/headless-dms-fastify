import { inject, injectable } from 'tsyringe';
import { IUserRepository } from './user.repository.interface.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { RegisterDTO } from './user.register.dto.js';
import { LoginDTO } from './user.login.dto.js';
import { IUserService } from './user.service.interface.js';
import { User } from '../../entities/user/User.js';
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
    const valid = await bcrypt.compare(data.password, user.passwordHash);
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

  async findById(id: string): Promise<Result<User | null, Error>> {
    this.logger.debug('Finding user by ID', { id });
    
    const userResult = await this.userRepository.findById(id);
    if (userResult.isErr()) {
      this.logger.error('Failed to find user by ID', userResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to find user'));
    }

    const user = userResult.unwrap();
    this.logger.debug('User lookup completed', { id, found: !!user });
    return Result.Ok(user);
  }

  async getAllUsers(): Promise<Result<User[], Error>> {
    this.logger.info('Getting all users');
    
    const usersResult = await this.userRepository.getAllUsers();
    if (usersResult.isErr()) {
      this.logger.error('Failed to get all users', usersResult.unwrapErr());
      return Result.Err(new Error('Failed to get users'));
    }

    const users = usersResult.unwrap();
    this.logger.info('Retrieved all users', { count: users.length });
    return Result.Ok(users);
  }

  async updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }): Promise<Result<User, Error>> {
    this.logger.info('Updating user', { id, fields: Object.keys(data) });
    
    // Check if user exists
    const existingResult = await this.userRepository.findById(id);
    if (existingResult.isErr()) {
      this.logger.error('Failed to check existing user', existingResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to check existing user'));
    }
    
    if (!existingResult.unwrap()) {
      this.logger.warn('Update attempted on non-existent user', { id });
      return Result.Err(new Error('User not found'));
    }

    // Check if email is being updated and if it's already taken
    if (data.email) {
      const emailCheckResult = await this.userRepository.findByEmail(data.email);
      if (emailCheckResult.isErr()) {
        this.logger.error('Failed to check email availability', emailCheckResult.unwrapErr(), { email: data.email });
        return Result.Err(new Error('Failed to check email availability'));
      }
      
      const existingUser = emailCheckResult.unwrap();
      if (existingUser && existingUser.id !== id) {
        this.logger.warn('Update attempted with existing email', { id, email: data.email });
        return Result.Err(new Error('Email already taken'));
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const updateResult = await this.userRepository.updateUser(id, updateData);
    if (updateResult.isErr()) {
      this.logger.error('Failed to update user', updateResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to update user'));
    }

    const updatedUser = updateResult.unwrap();
    this.logger.info('User updated successfully', { id, email: updatedUser.email });
    return Result.Ok(updatedUser);
  }

  async deleteUser(id: string): Promise<Result<boolean, Error>> {
    this.logger.info('Deleting user', { id });
    
    // Check if user exists
    const existingResult = await this.userRepository.findById(id);
    if (existingResult.isErr()) {
      this.logger.error('Failed to check existing user', existingResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to check existing user'));
    }
    
    if (!existingResult.unwrap()) {
      this.logger.warn('Delete attempted on non-existent user', { id });
      return Result.Err(new Error('User not found'));
    }

    // Delete user
    const deleteResult = await this.userRepository.deleteUser(id);
    if (deleteResult.isErr()) {
      this.logger.error('Failed to delete user', deleteResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to delete user'));
    }

    const deleted = deleteResult.unwrap();
    if (deleted) {
      this.logger.info('User deleted successfully', { id });
    } else {
      this.logger.warn('User deletion failed - no rows affected', { id });
    }
    
    return Result.Ok(deleted);
  }
}
