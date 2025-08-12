import { inject, injectable } from 'tsyringe';
import type { UserRepositoryPort } from '../ports/UserRepositoryPort.js';
import type { DocumentRepositoryPort } from '../ports/DocumentRepositoryPort.js';
import type { ILogger } from '../../shared/interfaces/ILogger.js';
import { Result } from '@carbonteq/fp';
import { User } from '../../domain/entities/user/User.js';
import { Document } from '../../domain/entities/document/Document.js';

@injectable()
export class BusinessRuleService {
  private logger: ILogger;

  constructor(
    @inject('UserRepositoryPort') private userRepository: UserRepositoryPort,
    @inject('DocumentRepositoryPort') private documentRepository: DocumentRepositoryPort,
    @inject('ILogger') logger: ILogger
  ) {
    this.logger = logger.child({ module: 'BusinessRuleService' });
  }

  async canDeleteUser(user: User, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      if (user.id === requestingUserId) {
        this.logger.warn('User attempted to delete themselves', { userId: user.id });
        return Result.Ok(false);
      }
      if (user.isAdmin()) {
        const allUsersResult = await this.userRepository.getAllUsers();
        if (allUsersResult.isErr()) return Result.Err(allUsersResult.unwrapErr());
        const allUsersOrPage = allUsersResult.unwrap();
        const allUsers = Array.isArray(allUsersOrPage) ? allUsersOrPage : allUsersOrPage.data;
        const adminUsers = allUsers.filter((u) => u.isAdmin());
        if (adminUsers.length === 1 && adminUsers[0].id === user.id) {
          this.logger.warn('Attempted to delete the last admin user', { userId: user.id });
          return Result.Ok(false);
        }
      }
      this.logger.debug('User can be deleted', { userId: user.id });
      return Result.Ok(true);
    } catch (error) {
      this.logger.error('Error checking if user can be deleted', error instanceof Error ? error : new Error('Unknown error'), { userId: user.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check user deletion rules'));
    }
  }

  async canChangeRole(user: User, newRole: 'user' | 'admin', requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      if (user.id === requestingUserId && newRole === 'user' && user.isAdmin()) {
        const allUsersResult = await this.userRepository.getAllUsers();
        if (allUsersResult.isErr()) return Result.Err(allUsersResult.unwrapErr());
        const allUsersOrPage = allUsersResult.unwrap();
        const allUsers = Array.isArray(allUsersOrPage) ? allUsersOrPage : allUsersOrPage.data;
        const adminUsers = allUsers.filter((u) => u.isAdmin());
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

  async canDeleteDocument(document: Document, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      const requestingUserResult = await this.userRepository.findById(requestingUserId);
      if (requestingUserResult.isErr()) return Result.Err(requestingUserResult.unwrapErr());
      const requestingUser = requestingUserResult.unwrap();
      if (!requestingUser) return Result.Ok(false);
      const canDelete = document.userId === requestingUserId || requestingUser.isAdmin();
      this.logger.debug('Document deletion permission checked', { documentId: document.id, requestingUserId, canDelete });
      return Result.Ok(canDelete);
    } catch (error) {
      this.logger.error('Error checking document deletion permission', error instanceof Error ? error : new Error('Unknown error'), { documentId: document.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check document deletion permission'));
    }
  }

  async canAccessDocument(document: Document, requestingUserId: string): Promise<Result<boolean, Error>> {
    try {
      const requestingUserResult = await this.userRepository.findById(requestingUserId);
      if (requestingUserResult.isErr()) return Result.Err(requestingUserResult.unwrapErr());
      const requestingUser = requestingUserResult.unwrap();
      if (!requestingUser) return Result.Ok(false);
      const canAccess = document.userId === requestingUserId || requestingUser.isAdmin();
      this.logger.debug('Document access permission checked', { documentId: document.id, requestingUserId, canAccess });
      return Result.Ok(canAccess);
    } catch (error) {
      this.logger.error('Error checking document access permission', error instanceof Error ? error : new Error('Unknown error'), { documentId: document.id });
      return Result.Err(error instanceof Error ? error : new Error('Failed to check document access permission'));
    }
  }
}

// moved from shared/services to application/services and updated to use application ports

