import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '../../modules/user/user.repository.interface.js';
import { IDocumentRepository } from '../../modules/document/document.repository.interface.js';
import { ILogger } from '../interfaces/ILogger.js';
import { User } from '../../entities/user/User.js';
import { Document } from '../../entities/document/Document.js';
import { Result } from '@carbonteq/fp';

/**
 * BusinessRuleService - handles business rules that require repository access
 * This service can be injected into other services to check complex business rules
 */
@injectable()
export class BusinessRuleService {
  private logger: ILogger;

  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IDocumentRepository') private documentRepository: IDocumentRepository,
    @inject('ILogger') logger: ILogger
  ) {
    this.logger = logger.child({ module: 'BusinessRuleService' });
  }

  /**
   * BUSINESS RULE: Check if user can be deleted
   * Requires repository access to check business constraints
   */
  async canDeleteUser(user: User, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      // BUSINESS RULE: Cannot delete yourself
      if (user.id === requestingUserId) {
        this.logger.warn('User attempted to delete themselves', { userId: user.id });
        return Result.Ok(false);
      }

      // BUSINESS RULE: Cannot delete the last admin user
      if (user.isAdmin()) {
        const allUsersResult = await this.userRepository.getAllUsers();
        if (allUsersResult.isErr()) {
          return Result.Err(allUsersResult.unwrapErr());
        }

        const allUsers = allUsersResult.unwrap();
        const adminUsers = allUsers.filter(u => u.isAdmin());
        
        if (adminUsers.length === 1 && adminUsers[0].id === user.id) {
          this.logger.warn('Attempted to delete the last admin user', { userId: user.id });
          return Result.Ok(false);
        }
      }

      // BUSINESS RULE: Cannot delete users with active documents
      // This would require a method to get documents by user ID
      // For now, we'll allow deletion (placeholder)

      this.logger.debug('User can be deleted', { userId: user.id });
      return Result.Ok(true);
    } catch (error) {
      this.logger.error('Error checking if user can be deleted', error instanceof Error ? error : new Error('Unknown error'), { userId: user.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check user deletion rules'));
    }
  }

  /**
   * BUSINESS RULE: Check if user can change role
   * Requires repository access to check business constraints
   */
  async canChangeRole(user: User, newRole: 'user' | 'admin', requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      // BUSINESS RULE: Cannot change your own role to user if you're the only admin
      if (user.id === requestingUserId && newRole === 'user' && user.isAdmin()) {
        const allUsersResult = await this.userRepository.getAllUsers();
        if (allUsersResult.isErr()) {
          return Result.Err(allUsersResult.unwrapErr());
        }

        const allUsers = allUsersResult.unwrap();
        const adminUsers = allUsers.filter(u => u.isAdmin());
        
        if (adminUsers.length === 1 && adminUsers[0].id === user.id) {
          this.logger.warn('Attempted to demote the last admin user', { userId: user.id });
          return Result.Ok(false);
        }
      }

      this.logger.debug('User can change role', { userId: user.id, newRole });
      return Result.Ok(true);
    } catch (error) {
      this.logger.error('Error checking if user can change role', error instanceof Error ? error : new Error('Unknown error'), { userId: user.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check role change rules'));
    }
  }

  /**
   * BUSINESS RULE: Check if email is available for registration
   */
  async isEmailAvailableForRegistration(email: string): Promise<Result<boolean, Error>> {
    try {
      const existingUserResult = await this.userRepository.findByEmail(email);
      if (existingUserResult.isErr()) {
        return Result.Err(existingUserResult.unwrapErr());
      }

      const isAvailable = !existingUserResult.unwrap();
      this.logger.debug('Email availability checked', { email, isAvailable });
      return Result.Ok(isAvailable);
    } catch (error) {
      this.logger.error('Error checking email availability', error instanceof Error ? error : new Error('Unknown error'), { email });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check email availability'));
    }
  }

  /**
   * BUSINESS RULE: Check if email is available for update
   */
  async isEmailAvailableForUpdate(currentUserId: string, newEmail: string): Promise<Result<boolean, Error>> {
    try {
      const existingUserResult = await this.userRepository.findByEmail(newEmail);
      if (existingUserResult.isErr()) {
        return Result.Err(existingUserResult.unwrapErr());
      }

      const existingUser = existingUserResult.unwrap();
      const isAvailable = !existingUser || existingUser.id === currentUserId;
      
      this.logger.debug('Email availability for update checked', { currentUserId, newEmail, isAvailable });
      return Result.Ok(isAvailable);
    } catch (error) {
      this.logger.error('Error checking email availability for update', error instanceof Error ? error : new Error('Unknown error'), { currentUserId, newEmail });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check email availability for update'));
    }
  }

  /**
   * BUSINESS RULE: Check if document can be deleted
   */
  async canDeleteDocument(document: Document, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      // BUSINESS RULE: Only document owner or admin can delete
      const requestingUserResult = await this.userRepository.findById(requestingUserId);
      if (requestingUserResult.isErr()) {
        return Result.Err(requestingUserResult.unwrapErr());
      }

      const requestingUser = requestingUserResult.unwrap();
      if (!requestingUser) {
        return Result.Ok(false);
      }

      const canDelete = document.userId === requestingUserId || requestingUser.isAdmin();
      
      this.logger.debug('Document deletion permission checked', { 
        documentId: document.id, 
        requestingUserId, 
        canDelete 
      });
      
      return Result.Ok(canDelete);
    } catch (error) {
      this.logger.error('Error checking document deletion permission', error instanceof Error ? error : new Error('Unknown error'), { documentId: document.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check document deletion permission'));
    }
  }

  /**
   * BUSINESS RULE: Check if user can access document
   */
  async canAccessDocument(document: Document, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      // BUSINESS RULE: Only document owner or admin can access
      const requestingUserResult = await this.userRepository.findById(requestingUserId);
      if (requestingUserResult.isErr()) {
        return Result.Err(requestingUserResult.unwrapErr());
      }

      const requestingUser = requestingUserResult.unwrap();
      if (!requestingUser) {
        return Result.Ok(false);
      }

      const canAccess = document.userId === requestingUserId || requestingUser.isAdmin();
      
      this.logger.debug('Document access permission checked', { 
        documentId: document.id, 
        requestingUserId, 
        canAccess 
      });
      
      return Result.Ok(canAccess);
    } catch (error) {
      this.logger.error('Error checking document access permission', error instanceof Error ? error : new Error('Unknown error'), { documentId: document.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check document access permission'));
    }
  }
} 