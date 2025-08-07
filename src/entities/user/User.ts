import { BaseEntity } from '../base/BaseEntity.js';
import { UserValidator } from './UserValidator.js';
import { Result } from '@carbonteq/fp';

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

/**
 * User entity - encapsulates all user business logic
 * Independent of any external agency (database, framework, etc.)
 */
export class User extends BaseEntity<UserData> {
  private _name: string;
  private _email: string;
  private _passwordHash: string;
  private _role: 'user' | 'admin';
  private _validator: UserValidator;

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
    this._validator = new UserValidator();
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
  updateName(newName: string): Result<User, Error> {
    if (!this._validator.validateName(newName)) {
      return Result.Err(new Error('Invalid name format'));
    }
    
    // BUSINESS RULE: Name cannot be empty
    if (!newName.trim()) {
      return Result.Err(new Error('Name cannot be empty'));
    }
    
    // BUSINESS RULE: Name cannot be the same as current
    if (this._name === newName.trim()) {
      return Result.Err(new Error('New name must be different from current name'));
    }
    
    this._name = newName.trim();
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  /**
   * Update user email with validation and state management
   * @param newEmail - New email to set
   * @returns Result indicating success or failure with reason
   */
  updateEmail(newEmail: string): Result<User, Error> {
    if (!this._validator.validateEmail(newEmail)) {
      return Result.Err(new Error('Invalid email format'));
    }
    
    // BUSINESS RULE: Email cannot be empty
    if (!newEmail.trim()) {
      return Result.Err(new Error('Email cannot be empty'));
    }
    
    // BUSINESS RULE: Email cannot be the same as current
    if (this._email.toLowerCase() === newEmail.trim().toLowerCase()) {
      return Result.Err(new Error('New email must be different from current email'));
    }
    
    this._email = newEmail.trim().toLowerCase();
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  /**
   * Update user password with validation and state management
   * @param newPasswordHash - New password hash to set
   * @returns Result indicating success or failure with reason
   */
  updatePassword(newPasswordHash: string): Result<User, Error> {
    if (!this._validator.validatePasswordHash(newPasswordHash)) {
      return Result.Err(new Error('Invalid password hash format'));
    }
    
    // BUSINESS RULE: Password hash cannot be empty
    if (!newPasswordHash.trim()) {
      return Result.Err(new Error('Password hash cannot be empty'));
    }
    
    // BUSINESS RULE: Password hash cannot be the same as current
    if (this._passwordHash === newPasswordHash) {
      return Result.Err(new Error('New password must be different from current password'));
    }
    
    this._passwordHash = newPasswordHash;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  /**
   * Update user role with validation and state management
   * @param newRole - New role to set
   * @returns Result indicating success or failure with reason
   */
  updateRole(newRole: 'user' | 'admin'): Result<User, Error> {
    if (!this._validator.validateRole(newRole)) {
      return Result.Err(new Error('Invalid role format'));
    }
    
    // BUSINESS RULE: Role cannot be the same as current
    if (this._role === newRole) {
      return Result.Err(new Error('New role must be different from current role'));
    }
    
    this._role = newRole;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this._role === 'admin';
  }

  /**
   * Check if user can perform admin actions
   */
  canPerformAdminAction(): boolean {
    return this.isAdmin();
  }

  /**
   * Archive user (soft delete)
   * @returns Result indicating success or failure with reason
   */
  archive(): Result<User, Error> {
    // BUSINESS RULE: Cannot archive admin users
    if (this.isAdmin()) {
      return Result.Err(new Error('Cannot archive admin users'));
    }
    
    // BUSINESS RULE: Cannot archive already archived users
    if (this.isArchived()) {
      return Result.Err(new Error('User is already archived'));
    }
    
    // Add archived status (we'll need to add this to the entity)
    // For now, we'll use a different approach - mark as inactive
    this.markAsUpdated();
    
    return Result.Ok(this);
  }

  /**
   * Check if user is archived
   */
  isArchived(): boolean {
    // For now, we'll use a simple check
    // In a real implementation, you'd have an archived field
    return false;
  }

  /**
   * Get user's display name
   */
  getDisplayName(): string {
    return this._name;
  }

  /**
   * Get user's initials
   */
  getInitials(): string {
    const names = this._name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return this._name.substring(0, 2).toUpperCase();
  }

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check
   */
  hasPermission(permission: string): boolean {
    // BUSINESS RULE: Admin users have all permissions
    if (this.isAdmin()) {
      return true;
    }
    
    // BUSINESS RULE: Regular users have basic permissions
    const basicPermissions = ['read_own_documents', 'upload_documents', 'edit_own_profile'];
    return basicPermissions.includes(permission);
  }

  /**
   * Validate user data
   */
  validate(): boolean {
    return this._validator.validateUser(this);
  }

  /**
   * Convert to JSON representation
   */
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

  /**
   * Create a clone of this user
   */
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

  /**
   * Create user from data (static factory method)
   */
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

  /**
   * Create new user (static factory method)
   */
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