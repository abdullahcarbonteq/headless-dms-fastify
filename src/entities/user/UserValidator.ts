import { User } from './User.js';

/**
 * User validator - handles all business rule validation
 * Separates input validation from business validation
 */
export class UserValidator {
  /**
   * Validate user name (business rule)
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
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name.trim());
  }

  /**
   * Validate email format (business rule)
   */
  validateEmail(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    
    // Basic email format validation
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
   * Check if user can be deleted (business rule)
   */
  canDeleteUser(user: User): boolean {
    // Business rule: Cannot delete the last admin user
    // This would need to be checked against the repository in practice
    return true;
  }

  /**
   * Check if user can change role (business rule)
   */
  canChangeRole(user: User, newRole: 'user' | 'admin'): boolean {
    // Business rule: Cannot demote the last admin
    // This would need to be checked against the repository in practice
    return true;
  }
} 