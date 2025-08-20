import { AppResult, AppError, UUID, DateTime } from '@carbonteq/hexapp';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Test helpers for working with hexapp types and AppResult patterns
 */
export class HexappTestHelpers {
  /**
   * Assert that an AppResult is successful
   */
  static assertSuccess<T>(result: AppResult<T>, expectedData?: T): T {
    expect(result.isOk()).to.be.true;
    const data = result.unwrap();
    if (expectedData !== undefined) {
      expect(data).to.deep.equal(expectedData);
    }
    return data;
  }

  /**
   * Assert that an AppResult is an error
   */
  static assertError<T>(result: AppResult<T>, expectedError?: string | AppError): AppError {
    expect(result.isErr()).to.be.true;
    const error = result.unwrapErr();
    if (expectedError !== undefined) {
      if (typeof expectedError === 'string') {
        expect(error.message).to.include(expectedError);
      } else {
        expect(error).to.deep.equal(expectedError);
      }
    }
    return error;
  }

  /**
   * Create a mock AppResult success
   */
  static mockSuccess<T>(data: T): AppResult<T> {
    return AppResult.Ok(data);
  }

  /**
   * Create a mock AppResult error
   */
  static mockError<T>(error: AppError): AppResult<T> {
    return AppResult.Err(error);
  }

  /**
   * Create a mock AppResult error with generic message
   */
  static mockGenericError<T>(message: string): AppResult<T> {
    return AppResult.Err(AppError.Generic(message));
  }

  /**
   * Create a mock AppResult error with not found
   */
  static mockNotFoundError<T>(message: string): AppResult<T> {
    return AppResult.Err(AppError.NotFound(message));
  }

  /**
   * Create a mock AppResult error with invalid data
   */
  static mockInvalidDataError<T>(message: string): AppResult<T> {
    return AppResult.Err(AppError.InvalidData(message));
  }

  /**
   * Create a mock AppResult error with unauthorized
   */
  static mockUnauthorizedError<T>(message: string): AppResult<T> {
    return AppResult.Err(AppError.Unauthorized(message));
  }

  /**
   * Create a mock UUID for testing
   */
  static mockUUID(): UUID {
    return UUID.fromTrusted('123e4567-e89b-12d3-a456-426614174000');
  }

  /**
   * Create a mock DateTime for testing
   */
  static mockDateTime(): DateTime {
    return DateTime.from(new Date('2023-01-01T00:00:00Z'));
  }

  /**
   * Create a mock repository that returns success
   */
  static mockRepositorySuccess<T>(data: T) {
    return {
      isOk: () => true,
      isErr: () => false,
      unwrap: () => data,
      unwrapErr: () => { throw new Error('Cannot unwrap error from success result'); }
    };
  }

  /**
   * Create a mock repository that returns error
   */
  static mockRepositoryError(error: AppError) {
    return {
      isOk: () => false,
      isErr: () => true,
      unwrap: () => { throw new Error('Cannot unwrap data from error result'); },
      unwrapErr: () => error
    };
  }

  /**
   * Create a mock async repository method that returns success
   */
  static mockAsyncRepositorySuccess<T>(data: T) {
    return sinon.stub().resolves(this.mockRepositorySuccess(data));
  }

  /**
   * Create a mock async repository method that returns error
   */
  static mockAsyncRepositoryError(error: AppError) {
    return sinon.stub().resolves(this.mockRepositoryError(error));
  }

  /**
   * Create a mock auth service that returns success
   */
  static mockAuthSuccess<T>(data: T) {
    return {
      isOk: () => true,
      isErr: () => false,
      unwrap: () => data,
      unwrapErr: () => { throw new Error('Cannot unwrap error from success result'); }
    };
  }

  /**
   * Create a mock auth service that returns error
   */
  static mockAuthError(error: AppError) {
    return {
      isOk: () => false,
      isErr: () => true,
      unwrap: () => { throw new Error('Cannot unwrap data from error result'); },
      unwrapErr: () => error
    };
  }

  /**
   * Create a mock async auth method that returns success
   */
  static mockAsyncAuthSuccess<T>(data: T) {
    return sinon.stub().resolves(this.mockAuthSuccess(data));
  }

  /**
   * Create a mock async auth method that returns error
   */
  static mockAsyncAuthError(error: AppError) {
    return sinon.stub().resolves(this.mockAuthError(error));
  }

  /**
   * Create test data with hexapp types
   */
  static createTestData() {
    return {
      user: {
        id: this.mockUUID(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        createdAt: this.mockDateTime(),
        updatedAt: this.mockDateTime()
      },
      document: {
        id: this.mockUUID(),
        filename: 'test-document.pdf',
        mimetype: 'application/pdf',
        path: '/test-uploads/test-document.pdf',
        tags: ['test', 'document'],
        description: 'Test document',
        userId: this.mockUUID(),
        status: 'active' as const,
        createdAt: this.mockDateTime(),
        updatedAt: this.mockDateTime()
      }
    };
  }
}

// Export individual functions for convenience
export const {
  assertSuccess,
  assertError,
  mockSuccess,
  mockError,
  mockGenericError,
  mockNotFoundError,
  mockInvalidDataError,
  mockUnauthorizedError,
  mockUUID,
  mockDateTime,
  mockRepositorySuccess,
  mockRepositoryError,
  mockAsyncRepositorySuccess,
  mockAsyncRepositoryError,
  mockAuthSuccess,
  mockAuthError,
  mockAsyncAuthSuccess,
  mockAsyncAuthError,
  createTestData
} = HexappTestHelpers; 