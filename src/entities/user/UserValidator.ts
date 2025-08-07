import { User } from './User.js';

/**
 * User validator - handles BUSINESS RULE validation only
 * Input validation is handled by DTOs (Zod schemas)
 * Business rules are domain-specific logic that can be tested independently
 */
export class UserValidator {
  /**
   * BUSINESS RULE: Validate user name format and content
   * This is business logic, not input validation
   */
  validateName(name: string): boolean {
    if (!name || name.trim().length === 0) {
      return false;
    }
    
    if (name.trim().length < 2) {
      return false;
    }
    
    if (name.trim().length > 100) {
      return false;
    }
    
    // BUSINESS RULE: Names can only contain letters, spaces, hyphens, apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name.trim());
  }

  /**
   * BUSINESS RULE: Validate email format and domain
   * This is business logic, not input validation
   */
  validateEmail(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    
    // BUSINESS RULE: Email must follow standard format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate password hash (business rule)
   */
  validatePasswordHash(passwordHash: string): boolean {
    if (!passwordHash || passwordHash.trim().length === 0) {
      return false;
    }
    
    // Check if it's a bcrypt hash (starts with $2b$)
    return passwordHash.startsWith('$2b$');
  }

  /**
   * Validate role (business rule)
   */
  validateRole(role: string): boolean {
    return role === 'user' || role === 'admin';
  }

  /**
   * Validate complete user (business rule)
   */
  validateUser(user: User): boolean {
    return (
      this.validateName(user.name) &&
      this.validateEmail(user.email) &&
      this.validatePasswordHash(user.passwordHash) &&
      this.validateRole(user.role)
    );
  }

  /**
   * Validate user creation data (business rule)
   */
  validateCreateUserData(data: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
  }): boolean {
    return (
      this.validateName(data.name) &&
      this.validateEmail(data.email) &&
      this.validatePasswordHash(data.passwordHash) &&
      this.validateRole(data.role)
    );
  }

  /**
   * Validate user update data (business rule)
   */
  validateUpdateUserData(data: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
  }>): boolean {
    // For updates, only validate the fields that are provided
    if (data.name !== undefined && !this.validateName(data.name)) {
      return false;
    }
    
    if (data.email !== undefined && !this.validateEmail(data.email)) {
      return false;
    }
    
    if (data.passwordHash !== undefined && !this.validatePasswordHash(data.passwordHash)) {
      return false;
    }
    
    if (data.role !== undefined && !this.validateRole(data.role)) {
      return false;
    }
    
    return true;
  }



  /**
   * BUSINESS RULE: Check if user can perform admin actions
   */
  canPerformAdminAction(user: User): boolean {
    // BUSINESS RULE: Only admin users can perform admin actions
    return user.isAdmin();
  }

  /**
   * BUSINESS RULE: Check if user can access sensitive data
   */
  canAccessSensitiveData(user: User, targetUserId: string): boolean {
    // BUSINESS RULE: Users can only access their own data, unless they're admin
    return user.id === targetUserId || user.isAdmin();
  }
} 