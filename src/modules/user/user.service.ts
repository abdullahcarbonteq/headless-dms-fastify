import { UserRepository } from './user.repository.js';
import { RegisterDTO } from './dto/register.dto.js';
import { LoginDTO } from './dto/login.dto.js';
import { IUserService, User } from './interfaces/IUserService.js';
import { Result } from '@carbonteq/fp';
import bcrypt from 'bcrypt';

export const UserService: IUserService = {
  async register(data: RegisterDTO): Promise<Result<User, Error>> {
    try {
      // Check if user already exists
      const existing = await UserRepository.findByEmail(data.email);
      if (existing) {
        return Result.Err(new Error('User already exists'));
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await UserRepository.createUser({ ...data, passwordHash });
      return Result.Ok(user);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Registration failed'));
    }
  },

  async login(data: LoginDTO): Promise<Result<User, Error>> {
    try {
      const user = await UserRepository.findByEmail(data.email);
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
      const user = await UserRepository.findByEmail(email);
      return Result.Ok(user);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('Failed to find user'));
    }
  }
};
