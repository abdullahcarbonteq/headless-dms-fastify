import 'reflect-metadata';
import { container } from 'tsyringe';
import { ILogger } from '../../src/shared/interfaces/ILogger.js';
import { IConfigurationService } from '../../src/shared/interfaces/IConfigurationService.js';
import type { UserRepositoryPort } from '../../src/application/ports/UserRepositoryPort.js';
import type { AuthPort } from '../../src/application/ports/AuthPort.js';
import type { DocumentRepositoryPort } from '../../src/application/ports/DocumentRepositoryPort.js';
import type { FileStoragePort } from '../../src/application/ports/FileStoragePort.js';

// Create a child container for tests
export const testContainer = container.createChildContainer();

// Helper function to create mock result objects
function createMockResult<T>(value: T, isOk: boolean = true) {
  return {
    isOk: () => isOk,
    isErr: () => !isOk,
    unwrap: () => value,
    unwrapErr: () => new Error('Mock error')
  };
}

// Mock logger
const mockLogger: ILogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  child: () => mockLogger
};

// Mock configuration service
const mockConfig: IConfigurationService = {
  get app() {
    return {
      environment: 'test' as const,
      cors: {
        origin: 'http://localhost:3000',
        credentials: true
      },
      logging: {
        level: 'error' as const,
        format: 'text' as const,
        enableConsole: true,
        enableFile: false
      },
      upload: {
        maxFileSize: 1048576,
        allowedMimeTypes: ['text/plain', 'application/pdf'],
        uploadDir: './test-uploads',
        maxFiles: 10
      }
    };
  },
  get database() {
    return {
      url: 'postgresql://test:test@localhost:5432/test_db'
    };
  },
  get jwt() {
    return {
      secret: 'test-secret',
      expiresIn: '1h'
    };
  },
  get server() {
    return {
      port: 3001,
      host: 'localhost'
    };
  },
  validate: () => {},
  getAll() {
    return {
      app: this.app,
      database: this.database,
      jwt: this.jwt,
      server: this.server
    };
  }
};

// Mock user repository
const mockUserRepository: UserRepositoryPort = {
  createUser: async (user) => createMockResult({ 
    id: '123e4567-e89b-12d3-a456-426614174000', 
    name: user.name, 
    email: user.email, 
    role: user.role 
  }),
  findByEmail: async () => createMockResult(null),
  findById: async (id) => {
    // Return the user if ID matches our test ID, otherwise null
    if (id === '123e4567-e89b-12d3-a456-426614174000') {
      return createMockResult({ 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: 'Bob Smith', 
        email: 'bob@example.com', 
        role: 'admin' 
      });
    }
    return createMockResult(null);
  },
  getAllUsers: async (pagination) => {
    if (pagination) {
      // Return paginated result
      return createMockResult({
        data: [],
        pageNum: pagination.pageNum || 1,
        pageSize: pagination.pageSize || 10,
        totalPages: 0,
        total: 0
      });
    } else {
      // Return array result
      return createMockResult([]);
    }
  },
  updateUser: async (user) => createMockResult({ 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role 
  }),
  deleteUser: async (id) => {
    // Return true for test-user-id, false for others
    if (id === '123e4567-e89b-12d3-a456-426614174000') {
      return createMockResult(true);
    }
    return createMockResult(false);
  }
};

// Mock auth service
const mockAuthService: AuthPort = {
  hashPassword: async () => createMockResult('$2b$10$hashedpassword'),
  comparePassword: async () => createMockResult(true),
  generateToken: async () => createMockResult('test-token'),
  verifyToken: async () => createMockResult({ userId: 'test-user-id', email: 'test@example.com', role: 'user' }),
  generateDownloadToken: async () => createMockResult('download-token'),
  verifyDownloadToken: async () => createMockResult({ docId: 'test-doc-id', userId: 'test-user-id' })
};

// Mock document repository
const mockDocumentRepository: DocumentRepositoryPort = {
  createDocument: async () => createMockResult({ id: 'test-doc-id', filename: 'test.pdf', mimetype: 'application/pdf' }),
  findById: async () => createMockResult(null),
  getAllDocuments: async (pagination) => {
    if (pagination) {
      // Return paginated result
      return createMockResult({
        data: [],
        pageNum: pagination.pageNum || 1,
        pageSize: pagination.pageSize || 10,
        totalPages: 0,
        total: 0
      });
    } else {
      // Return array result
      return createMockResult([]);
    }
  },
  updateDocument: async () => createMockResult({ id: 'test-doc-id', filename: 'updated.pdf', mimetype: 'application/pdf' }),
  deleteDocument: async () => createMockResult(true),
  searchDocuments: async (criteria, pagination) => {
    if (pagination) {
      // Return paginated result
      return createMockResult({
        data: [],
        pageNum: pagination.pageNum || 1,
        pageSize: pagination.pageSize || 10,
        totalPages: 0,
        total: 0
      });
    } else {
      // Return array result
      return createMockResult([]);
    }
  }
};

// Mock file storage
const mockFileStorage: FileStoragePort = {
  save: async () => createMockResult({ path: '/test/path', filename: 'test.pdf', mimetype: 'application/pdf', size: 1024 }),
  remove: async () => createMockResult(true)
};

// Register mocked services in the test container
testContainer.registerInstance('ILogger', mockLogger);
testContainer.registerInstance('IConfigurationService', mockConfig);
testContainer.registerInstance('UserRepositoryPort', mockUserRepository);
testContainer.registerInstance('AuthPort', mockAuthService);
testContainer.registerInstance('DocumentRepositoryPort', mockDocumentRepository);
testContainer.registerInstance('FileStoragePort', mockFileStorage);

// Export the mocks for individual test use
export { 
  mockLogger, 
  mockConfig, 
  mockUserRepository, 
  mockAuthService, 
  mockDocumentRepository, 
  mockFileStorage 
}; 