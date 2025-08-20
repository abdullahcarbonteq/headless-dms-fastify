import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Generic test helpers that work with any Result-like type
 * These match the AppResult interface but don't require hexapp imports
 */

// Generic Error interface for testing
export interface TestError {
  message: string;
  status?: number;
  code?: string;
  name?: string;
}

// Generic Result interface for testing
export interface TestResult<T, E = TestError> {
  isOk(): boolean;
  isErr(): boolean;
  unwrap(): T;
  unwrapErr(): E;
}

/**
 * Test helpers for working with Result-like types
 */
export class GenericTestHelpers {
  /**
   * Assert that a result is successful
   */
  static assertSuccess<T>(result: TestResult<T>, expectedData?: T): T {
    expect(result.isOk()).to.be.true;
    const data = result.unwrap();
    if (expectedData !== undefined) {
      expect(data).to.deep.equal(expectedData);
    }
    return data;
  }

  /**
   * Assert that a result is an error
   */
  static assertError<T>(result: TestResult<T>, expectedError?: string | TestError): TestError {
    expect(result.isErr()).to.be.true;
    const error = result.unwrapErr();
    if (expectedError !== undefined) {
      if (typeof expectedError === 'string') {
        expect(error.message).to.include(expectedError);
      } else {
        expect(error.message).to.include(expectedError.message);
      }
    }
    return error;
  }

  /**
   * Create a mock success result
   */
  static mockSuccess<T>(data: T): TestResult<T> {
    return {
      isOk: () => true,
      isErr: () => false,
      unwrap: () => data,
      unwrapErr: () => { throw new Error('Cannot unwrap error from success result'); }
    };
  }

  /**
   * Create a mock error result
   */
  static mockError<T>(error: TestError): TestResult<T> {
    return {
      isOk: () => false,
      isErr: () => true,
      unwrap: () => { throw new Error('Cannot unwrap data from error result'); },
      unwrapErr: () => error
    };
  }

  /**
   * Create a mock generic error
   */
  static mockGenericError<T>(message: string): TestResult<T> {
    return this.mockError({ message });
  }

  /**
   * Create a mock not found error
   */
  static mockNotFoundError<T>(message: string): TestResult<T> {
    return this.mockError({ message, status: 404 });
  }

  /**
   * Create a mock invalid data error
   */
  static mockInvalidDataError<T>(message: string): TestResult<T> {
    return this.mockError({ message, status: 400 });
  }

  /**
   * Create a mock unauthorized error
   */
  static mockUnauthorizedError<T>(message: string): TestResult<T> {
    return this.mockError({ message, status: 401 });
  }

  /**
   * Create a mock UUID string for testing
   */
  static mockUUID(): string {
    return '123e4567-e89b-12d3-a456-426614174000';
  }

  /**
   * Create a mock date for testing
   */
  static mockDate(): Date {
    return new Date('2023-01-01T00:00:00Z');
  }

  /**
   * Create a mock repository that returns success
   */
  static mockRepositorySuccess<T>(data: T): TestResult<T> {
    return this.mockSuccess(data);
  }

  /**
   * Create a mock repository that returns error
   */
  static mockRepositoryError<T>(error: TestError): TestResult<T> {
    return this.mockError(error);
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
  static mockAsyncRepositoryError<T>(error: TestError) {
    return sinon.stub().resolves(this.mockRepositoryError(error));
  }

  /**
   * Create a mock auth service that returns success
   */
  static mockAuthSuccess<T>(data: T): TestResult<T> {
    return this.mockSuccess(data);
  }

  /**
   * Create a mock auth service that returns error
   */
  static mockAuthError<T>(error: TestError): TestResult<T> {
    return this.mockError(error);
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
  static mockAsyncAuthError<T>(error: TestError) {
    return sinon.stub().resolves(this.mockAuthError(error));
  }

  /**
   * Create test data with simple types
   */
  static createTestData() {
    return {
      user: {
        id: GenericTestHelpers.mockUUID(),
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        createdAt: GenericTestHelpers.mockDate(),
        updatedAt: GenericTestHelpers.mockDate()
      },
      document: {
        id: GenericTestHelpers.mockUUID(),
        filename: 'test-document.pdf',
        mimetype: 'application/pdf',
        path: '/test-uploads/test-document.pdf',
        tags: ['test', 'document'],
        description: 'Test document',
        userId: GenericTestHelpers.mockUUID(),
        status: 'active' as const,
        createdAt: GenericTestHelpers.mockDate(),
        updatedAt: GenericTestHelpers.mockDate()
      }
    };
  }

  /**
   * Create a mock entity with basic properties
   */
  static createMockEntity<T>(data: T, methods: Record<string, any> = {}): T & Record<string, any> {
    return {
      ...data,
      ...methods,
      // Add common entity methods
      validate: () => true,
      toJSON: () => data,
      clone: function() {
        return this;
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
  mockDate,
  mockRepositorySuccess,
  mockRepositoryError,
  mockAsyncRepositorySuccess,
  mockAsyncRepositoryError,
  mockAuthSuccess,
  mockAuthError,
  mockAsyncAuthSuccess,
  mockAsyncAuthError,
  createTestData,
  createMockEntity
} = GenericTestHelpers; 