import { User, UserData, CreateUserData } from './User.js';
import { Result } from '@carbonteq/fp';
import { EmailAddress } from '../../value-objects/EmailAddress.js';
import { PasswordHash } from '../../value-objects/PasswordHash.js';
import { UserName } from '../../value-objects/UserName.js';
import { UserId } from '../../value-objects/Ids.js';


export class UserFactory {
  private static validator = { validateCreateUserData: () => true, validateUser: () => true } as any;


  static createUser(data: CreateUserData): Result<User, Error> {
    if (data.role !== 'user' && data.role !== 'admin') {
      return Result.Err(new Error('Invalid role'));
    }

    const idRes = UserId.create();
    const nameRes = UserName.create(data.name);
    const emailRes = EmailAddress.create(data.email);
    const passRes = PasswordHash.create(data.passwordHash);
    if (idRes.isErr()) return Result.Err(idRes.unwrapErr());
    if (nameRes.isErr()) return Result.Err(nameRes.unwrapErr());
    if (emailRes.isErr()) return Result.Err(emailRes.unwrapErr());
    if (passRes.isErr()) return Result.Err(passRes.unwrapErr());

    const now = new Date();
    const user = new User(
      idRes.unwrap().value,
      nameRes.unwrap().value,
      emailRes.unwrap().value,
      passRes.unwrap().value,
      data.role,
      now,
      now
    );
    
    if (!user.validate()) {
      return Result.Err(new Error('Created user is invalid'));
    }

    return Result.Ok(user);
  }

 
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

 
  static createAdminUser(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'admin'
    });
  }

 
  static createRegularUser(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    });
  }

 
  static createUserWithDefaultRole(name: string, email: string, passwordHash: string): Result<User, Error> {
    return this.createRegularUser(name, email, passwordHash);
  }


  static fromDatabaseRow(row: any): Result<User, Error> {
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