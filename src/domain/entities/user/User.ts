import { BaseEntity } from '../base/BaseEntity.js';
import { AppResult, AppError } from '@carbonteq/hexapp';
import { UserName } from '../../value-objects/UserName.js';
import { EmailAddress } from '../../value-objects/EmailAddress.js';
import { PasswordHash } from '../../value-objects/PasswordHash.js';

// User data interface
export interface UserData {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// User creation data (without ID and timestamps)
export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
}

export class User extends BaseEntity<UserData> {
  private _name: string;
  private _email: string;
  private _passwordHash: string;
  private _role: 'user' | 'admin';

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    role: 'user' | 'admin',
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id, createdAt, updatedAt);
    this._name = name;
    this._email = email;
    this._passwordHash = passwordHash;
    this._role = role;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): 'user' | 'admin' {
    return this._role;
  }

  // Business logic methods
  /**
   * Update user name with validation and state management
   * @param newName - New name to set
   * @returns Result indicating success or failure with reason
   */
  updateName(newName: string): AppResult<User> {
    // Validate through Value Object for stronger guarantees
    const nameRes = UserName.create(newName);
    if (nameRes.isErr()) return AppResult.Err(AppError.Generic(nameRes.unwrapErr().message));
    
    if (!newName.trim()) {
      return AppResult.Err(AppError.Generic('Name cannot be empty'));
    }
    
    if (this._name === newName.trim()) {
      return AppResult.Err(AppError.Generic('New name must be different from current name'));
    }
    
    this._name = nameRes.unwrap().value;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return AppResult.Err(AppError.Generic('Entity became invalid after state change'));
    }
    
    return AppResult.Ok(this);
  }

  /**
   * Update user email with validation and state management
   * @param newEmail - New email to set
   * @returns Result indicating success or failure with reason
   */
  updateEmail(newEmail: string): AppResult<User> {
    const emailRes = EmailAddress.create(newEmail);
    if (emailRes.isErr()) return AppResult.Err(AppError.Generic(emailRes.unwrapErr().message));
    
    if (!newEmail.trim()) {
      return AppResult.Err(AppError.Generic('Email cannot be empty'));
    }
    
    if (this._email.toLowerCase() === newEmail.trim().toLowerCase()) {
      return AppResult.Err(AppError.Generic('New email must be different from current email'));
    }
    
    this._email = emailRes.unwrap().value;
    this.markAsUpdated();
    
    if (!this.validate()) {
      return AppResult.Err(AppError.Generic('Entity became invalid after state change'));
    }
    
    return AppResult.Ok(this);
  }

  /**
   * Update user password with validation and state management
   * @param newPasswordHash - New password hash to set
   * @returns Result indicating success or failure with reason
   */
  updatePassword(newPasswordHash: string): AppResult<User> {
    const passRes = PasswordHash.create(newPasswordHash);
    if (passRes.isErr()) return AppResult.Err(AppError.Generic(passRes.unwrapErr().message));
    
    if (!newPasswordHash.trim()) {
      return AppResult.Err(AppError.Generic('Password hash cannot be empty'));
    }
    

    if (this._passwordHash === newPasswordHash) {
      return AppResult.Err(AppError.Generic('New password must be different from current password'));
    }
    
    this._passwordHash = passRes.unwrap().value;
    this.markAsUpdated();
    
    if (!this.validate()) {
      return AppResult.Err(AppError.Generic('Entity became invalid after state change'));
    }
    
    return AppResult.Ok(this);
  }

  /**
   * Update user role with validation and state management
   * @param newRole - New role to set
   * @returns Result indicating success or failure with reason
   */
  updateRole(newRole: 'user' | 'admin'): AppResult<User> {
    if (newRole !== 'user' && newRole !== 'admin') {
      return AppResult.Err(AppError.Generic('Invalid role'));
    }
    
    // BUSINESS RULE: Role cannot be the same as current
    if (this._role === newRole) {
      return AppResult.Err(AppError.Generic('New role must be different from current role'));
    }
    
    this._role = newRole;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return AppResult.Err(AppError.Generic('Entity became invalid after state change'));
    }
    
    return AppResult.Ok(this);
  }

  isAdmin(): boolean {
    return this._role === 'admin';
  }

  // canPerformAdminAction(): boolean {
  //   return this.isAdmin();
  // }

  /**
   * Archive user (soft delete)
   * @returns Result indicating success or failure with reason
   */
  // archive(): Result<User, Error> {
  //   if (this.isAdmin()) {
  //     return Result.Err(new Error('Cannot archive admin users'));
  //   }
  //   if (this.isArchived()) {
  //     return Result.Err(new Error('User is already archived'));
  //   }
  //   // Placeholder archived status was not implemented; commenting unused method.
  //   this.markAsUpdated();
  //   return Result.Ok(this);
  // }

  /**
   * Check if user is archived
   */
  // isArchived(): boolean {
  //   // Placeholder; archived field not implemented.
  //   return false;
  // }

  // getDisplayName(): string {
  //   return this._name;
  // }

  // getInitials(): string {
  //   const names = this._name.split(' ');
  //   if (names.length >= 2) {
  //     return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  //   }
  //   return this._name.substring(0, 2).toUpperCase();
  // }

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check
   */
  // hasPermission(permission: string): boolean {
  //   if (this.isAdmin()) {
  //     return true;
  //   }
  //   const basicPermissions = ['read_own_documents', 'upload_documents', 'edit_own_profile'];
  //   return basicPermissions.includes(permission);
  // }

  validate(): boolean {
    return true; 
  }


  toJSON(): UserData {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      passwordHash: this._passwordHash,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  clone(): User {
    return new User(
      this._id,
      this._name,
      this._email,
      this._passwordHash,
      this._role,
      this._createdAt,
      this._updatedAt
    );
  }

 
  static fromData(data: UserData): User {
    return new User(
      data.id,
      data.name,
      data.email,
      data.passwordHash,
      data.role,
      data.createdAt,
      data.updatedAt
    );
  }


  static create(data: CreateUserData): User {
    const now = new Date();
    return new User(
      '', // Empty ID for new user
      data.name,
      data.email,
      data.passwordHash,
      data.role,
      now,
      now
    );
  }
} 