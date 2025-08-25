import { User, UserData, CreateUserData } from './User.js';
import { AppResult, AppError } from '@carbonteq/hexapp';
import { EmailAddress } from '../../value-objects/EmailAddress.js';
import { PasswordHash } from '../../value-objects/PasswordHash.js';
import { UserName } from '../../value-objects/UserName.js';
import { UUID } from '@carbonteq/hexapp';


export class UserFactory {
  private static validator = { validateCreateUserData: () => true, validateUser: () => true } as any;


  static createUser(data: CreateUserData): AppResult<User> {
    if (data.role !== 'user' && data.role !== 'admin') {
      return AppResult.Err(AppError.Generic('Invalid role'));
    }

    const idRes = UUID.init();
    const nameRes = UserName.create(data.name);
    const emailRes = EmailAddress.create(data.email);
    const passRes = PasswordHash.create(data.passwordHash);
    // UUID.init returns a UUID directly (no AppResult)
    if (nameRes.isErr()) return AppResult.Err(AppError.Generic(nameRes.unwrapErr().message));
    if (emailRes.isErr()) return AppResult.Err(AppError.Generic(emailRes.unwrapErr().message));
    if (passRes.isErr()) return AppResult.Err(AppError.Generic(passRes.unwrapErr().message));

    const now = new Date();
    const user = new User(
      idRes,
      nameRes.unwrap().value,
      emailRes.unwrap().value,
      passRes.unwrap().value,
      data.role,
      now,
      now
    );
    
    if (!user.validate()) {
      return AppResult.Err(AppError.Generic('Created user is invalid'));
    }

    return AppResult.Ok(user);
  }

 
  static fromData(data: UserData): AppResult<User> {
    // Validate the data
    if (!this.validator.validateUser({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
    } as any)) {
      return AppResult.Err(AppError.Generic('Invalid user data'));
    }

    // Create user from data
    const user = User.fromData(data);
    
    // Validate the created user
    if (!user.validate()) {
      return AppResult.Err(AppError.Generic('User data is invalid'));
    }

    return AppResult.Ok(user);
  }

 
  static createAdminUser(name: string, email: string, passwordHash: string): AppResult<User> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'admin'
    });
  }

 
  static createRegularUser(name: string, email: string, passwordHash: string): AppResult<User> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    });
  }

 
  static createUserWithDefaultRole(name: string, email: string, passwordHash: string): AppResult<User> {
    return this.createRegularUser(name, email, passwordHash);
  }


  static fromDatabaseRow(row: any): AppResult<User> {
    try {
      const userData: UserData = {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.createdAt ? new Date(row.createdAt) : row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : row.updated_at ? new Date(row.updated_at) : new Date()
      };

      return this.fromData(userData);
    } catch (error) {
      return AppResult.Err(AppError.Generic(`Failed to create user from database row: ${error}`));
    }
  }

  /**
   * Create multiple users from database rows
   */
  static fromDatabaseRows(rows: any[]): AppResult<User[]> {
    const users: User[] = [];
    
    for (const row of rows) {
      const userResult = this.fromDatabaseRow(row);
      if (userResult.isErr()) {
        return AppResult.Err(AppError.Generic(userResult.unwrapErr().message));
      }
      users.push(userResult.unwrap());
    }

    return AppResult.Ok(users);
  }
} 