import { IUserRepository } from './interfaces/IUserRepository.js';
import { RegisterDTO } from './dto/register.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import { IUserService, User } from './interfaces/IUserService.js';
import { Result } from '@carbonteq/fp';
import bcrypt from 'bcrypt';

// TODO: This will be injected via DI in Phase 2D
const userRepository: IUserRepository = new (await import('./repositories/DrizzleUserRepository.js')).DrizzleUserRepository();

export const UserService: IUserService = {
  async register(data: RegisterDTO): Promise<Result<User, Error>> {
    try {
      // Check if user already exists
      const existingResult = await userRepository.findByEmail(data.email);
      if (existingResult.isErr()) {
        return Result.Err(new Error('Failed to check existing user'));
      }
      
      if (existingResult.unwrap()) {
        return Result.Err(new Error('User already exists'));
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const createResult = await userRepository.createUser({ ...data, passwordHash });
      if (createResult.isErr()) {
        return Result.Err(new Error('Failed to create user'));
      }

      return Result.Ok(createResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Registration failed'));
    }
  },

  async login(data: LoginDTO): Promise<Result<User, Error>> {
    try {
      const userResult = await userRepository.findByEmail(data.email);
      if (userResult.isErr()) {
        return Result.Err(new Error('Failed to find user'));
      }

      const user = userResult.unwrap();
      if (!user) {
        return Result.Err(new Error('Invalid email'));
      }

      const valid = await bcrypt.compare(data.password, user.password_hash);
      if (!valid) {
        return Result.Err(new Error('The Password you entered is incorrect'));
      }

      return Result.Ok(user);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Login failed'));
    }
  },

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const userResult = await userRepository.findByEmail(email);
      if (userResult.isErr()) {
        return Result.Err(new Error('Failed to find user'));
      }

      return Result.Ok(userResult.unwrap());
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user'));
    }
  }
};
