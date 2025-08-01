import { BaseEntity } from '../base/BaseEntity.js';
import { UserValidator } from './UserValidator.js';

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
   * Update user name with validation
   */
  updateName(newName: string): boolean {
    if (!this._validator.validateName(newName)) {
      return false;
    }
    
    this._name = newName;
    this.markAsUpdated();
    return true;
  }

  /**
   * Update user email with validation
   */
  updateEmail(newEmail: string): boolean {
    if (!this._validator.validateEmail(newEmail)) {
      return false;
    }
    
    this._email = newEmail;
    this.markAsUpdated();
    return true;
  }

  /**
   * Update user password with validation
   */
  updatePassword(newPasswordHash: string): boolean {
    if (!this._validator.validatePasswordHash(newPasswordHash)) {
      return false;
    }
    
    this._passwordHash = newPasswordHash;
    this.markAsUpdated();
    return true;
  }

  /**
   * Update user role with validation
   */
  updateRole(newRole: 'user' | 'admin'): boolean {
    if (!this._validator.validateRole(newRole)) {
      return false;
    }
    
    this._role = newRole;
    this.markAsUpdated();
    return true;
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