import { inject, injectable } from 'tsyringe';
import { IUserRepository } from './user.repository.interface.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { RegisterDTO } from './user.register.dto.js';
import { LoginDTO } from './user.login.dto.js';
import { IUserService } from './user.service.interface.js';
import { User } from '../../entities/user/User.js';
import { Result } from '@carbonteq/fp';
import { IAuthService } from '../../shared/interfaces/IAuthService.js';
import { UserValidator } from '../../entities/user/UserValidator.js';
import { BusinessRuleService } from '../../shared/services/BusinessRuleService.js';

@injectable()
export class UserService implements IUserService {
  private logger: ILogger;
  private userValidator: UserValidator;

  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') logger: ILogger,
    @inject('IAuthService') private authService: IAuthService,
    @inject('BusinessRuleService') private businessRuleService: BusinessRuleService
  ) {
    this.logger = logger.child({ module: 'UserService' });
    this.userValidator = new UserValidator();
  }

  async register(data: RegisterDTO): Promise<Result<User, Error>> {
    this.logger.info('Starting user registration', { email: data.email, role: data.role });
    
    // BUSINESS RULE: Validate user data using business rules
    if (!this.userValidator.validateName(data.name)) {
      this.logger.warn('User registration failed - invalid name format', { email: data.email, name: data.name });
      return Result.Err(new Error('Invalid name format'));
    }
    
    if (!this.userValidator.validateEmail(data.email)) {
      this.logger.warn('User registration failed - invalid email format', { email: data.email });
      return Result.Err(new Error('Invalid email format'));
    }
    
    // BUSINESS RULE: Check if user can register with this email (uniqueness)
    this.logger.debug('Checking if user can register with this email', { email: data.email });
    const emailAvailableResult = await this.businessRuleService.isEmailAvailableForRegistration(data.email);
    if (emailAvailableResult.isErr()) {
      this.logger.error('Failed to check email availability', emailAvailableResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to check email availability'));
    }
    
    if (!emailAvailableResult.unwrap()) {
      this.logger.warn('User registration attempted with existing email', { email: data.email });
      return Result.Err(new Error('User already exists'));
    }

    // Hash password
    this.logger.debug('Hashing password');
    const hashResult = await this.authService.hashPassword(data.password);
    if (hashResult.isErr()) {
      this.logger.error('Failed to hash password', hashResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to hash password'));
    }
    const passwordHash = hashResult.unwrap();

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
    const compareResult = await this.authService.comparePassword(data.password, user.passwordHash);
    if (compareResult.isErr()) {
      this.logger.error('Failed to compare passwords', compareResult.unwrapErr(), { email: data.email });
      return Result.Err(new Error('Failed to verify password'));
    }
    
    const valid = compareResult.unwrap();
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
    
    const existingUser = existingResult.unwrap();
    if (!existingUser) {
      this.logger.warn('Update attempted on non-existent user', { id });
      return Result.Err(new Error('User not found'));
    }

    // BUSINESS RULE: Validate update data using business rules
    if (data.name && !this.userValidator.validateName(data.name)) {
      this.logger.warn('User update failed - invalid name format', { id, name: data.name });
      return Result.Err(new Error('Invalid name format'));
    }
    
    if (data.email && !this.userValidator.validateEmail(data.email)) {
      this.logger.warn('User update failed - invalid email format', { id, email: data.email });
      return Result.Err(new Error('Invalid email format'));
    }

    // BUSINESS RULE: Check if email is being updated and if it's already taken
    if (data.email) {
      const emailAvailableResult = await this.businessRuleService.isEmailAvailableForUpdate(id, data.email);
      if (emailAvailableResult.isErr()) {
        this.logger.error('Failed to check email availability for update', emailAvailableResult.unwrapErr(), { id, email: data.email });
        return Result.Err(new Error('Failed to check email availability'));
      }
      
      if (!emailAvailableResult.unwrap()) {
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
      const hashResult = await this.authService.hashPassword(data.password);
      if (hashResult.isErr()) {
        this.logger.error('Failed to hash password for update', hashResult.unwrapErr(), { id });
        return Result.Err(new Error('Failed to hash password'));
      }
      updateData.passwordHash = hashResult.unwrap();
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

  async deleteUser(id: string, requestingUserId: string): Promise<Result<boolean, Error>> {
    this.logger.info('Deleting user', { id, requestingUserId });
    
    // Check if user exists
    const existingResult = await this.userRepository.findById(id);
    if (existingResult.isErr()) {
      this.logger.error('Failed to check existing user', existingResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to check existing user'));
    }
    
    const existingUser = existingResult.unwrap();
    if (!existingUser) {
      this.logger.warn('Delete attempted on non-existent user', { id });
      return Result.Err(new Error('User not found'));
    }

    // BUSINESS RULE: Check if user can be deleted
    const canDeleteResult = await this.businessRuleService.canDeleteUser(existingUser, requestingUserId);
    if (canDeleteResult.isErr()) {
      this.logger.error('Failed to check user deletion rules', canDeleteResult.unwrapErr(), { id });
      return Result.Err(new Error('Failed to check user deletion rules'));
    }

    if (!canDeleteResult.unwrap()) {
      this.logger.warn('User deletion blocked by business rules', { id, requestingUserId });
      return Result.Err(new Error('Cannot delete this user due to business rules'));
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
