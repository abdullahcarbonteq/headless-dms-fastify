import { User, UserData, CreateUserData } from './User.js';
import { UserValidator } from './UserValidator.js';
import { Result } from '@carbonteq/fp';

/**
 * User factory - provides static factory methods for creating users
 * Implements factory pattern for user creation
 */
export class UserFactory {
  private static validator = new UserValidator();

  /**
   * Create a new user with validation
   */
  static createUser(data: CreateUserData): Result<User, Error> {
    // Validate creation data
    if (!this.validator.validateCreateUserData(data)) {
      return Result.Err(new Error('Invalid user creation data'));
    }

    // Create user entity
    const user = User.create(data);
    
    // Validate the created user
    if (!user.validate()) {
      return Result.Err(new Error('Created user is invalid'));
    }

    return Result.Ok(user);
  }

  /**
   * Create user from existing data (e.g., from database)
   */
  static fromData(data: UserData): Result<User, Error> {
    // Validate the data
    if (!this.validator.validateUser({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    } as any)) {
      return Result.Err(new Error('Invalid user data'));
    }

    // Create user from data
    const user = User.fromData(data);
    
    // Validate the created user
    if (!user.validate()) {
      return Result.Err(new Error('User data is invalid'));
    }

    return Result.Ok(user);
  }

  /**
   * Create admin user
   */
  static createAdminUser(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'admin'
    });
  }

  /**
   * Create regular user
   */
  static createRegularUser(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    });
  }

  /**
   * Create user with default role (user)
   */
  static createUserWithDefaultRole(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createRegularUser(name, email, passwordHash);
  }

  /**
   * Create user from database row (converts database format to entity)
   */
  static fromDatabaseRow(row: any): Result<User, Error> {
    try {
      const userData: UserData = {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt || row.createdAt)
      };

      return this.fromData(userData);
    } catch (error) {
      return Result.Err(new Error(`Failed to create user from database row: ${error}`));
    }
  }

  /**
   * Create multiple users from database rows
   */
  static fromDatabaseRows(rows: any[]): Result<User[], Error> {
    const users: User[] = [];
    
    for (const row of rows) {
      const userResult = this.fromDatabaseRow(row);
      if (userResult.isErr()) {
        return Result.Err(userResult.unwrapErr());
      }
      users.push(userResult.unwrap());
    }

    return Result.Ok(users);
  }
} 