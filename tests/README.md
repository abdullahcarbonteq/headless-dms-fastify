# 🧪 Test Infrastructure

This project uses a comprehensive testing strategy with multiple layers of test coverage.

## 🏗️ Test Stack

- **Test Runner**: [Mocha](https://mochajs.org/) - Feature-rich JavaScript test framework
- **Assertion Library**: [Chai](https://www.chaijs.com/) - Expressive assertion library
- **Mocking/Stubbing**: [Sinon](https://sinonjs.org/) - Standalone test spies, stubs and mocks
- **TypeScript Support**: [tsx](https://github.com/esbuild-kit/tsx) - TypeScript execution engine

## 📁 Test Structure

```
tests/
├── unit/                    # 🧪 Unit Tests (Fast, Isolated)
│   ├── domain/            # Business logic, entities, value objects
│   ├── application/       # Use cases, business rules
│   └── infrastructure/    # Repositories, services (mocked)
├── integration/            # 🔗 Integration Tests (Medium Speed)
│   ├── api/               # HTTP endpoint tests with real business logic
│   └── database/          # Database integration tests
├── e2e/                   # 🎭 End-to-End Tests (Slow, Complete)
│   └── workflows/         # Full user journey tests
├── helpers/                # 🛠️ Test utilities and setup
├── fixtures/               # 📊 Test data and mock objects
└── setup.ts               # 🌍 Global test configuration
```

## 🎯 Test Types

### 🧪 Unit Tests
- **Purpose**: Test individual functions/methods in isolation
- **Speed**: Fast (milliseconds)
- **Scope**: Single class/function with mocked dependencies
- **Location**: `tests/unit/` or `tests/**/*.test.ts`

### 🔗 Integration Tests
- **Purpose**: Test multiple components working together
- **Speed**: Medium (seconds)
- **Scope**: API endpoints, service interactions, database operations
- **Location**: `tests/integration/**/*.spec.ts`

### 🎭 E2E Tests
- **Purpose**: Test complete user workflows from start to finish
- **Speed**: Slow (minutes)
- **Scope**: Entire system, real HTTP requests, authentication flows
- **Location**: `tests/e2e/**/*.spec.ts`

## 🚀 Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode for development
```

### By Layer
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # E2E tests only
```

### By Domain
```bash
npm run test:domain        # Domain layer tests
npm run test:application   # Application layer tests
npm run test:infrastructure # Infrastructure layer tests
npm run test:presentation  # Presentation layer tests
```

### Specific Test Files
```bash
npm run test:example       # Run example test
npm test tests/domain/entities/document.spec.ts  # Specific file
```

## 🛠️ Test Helpers

### Generic Test Helpers (`tests/helpers/generic-test-helpers.ts`)
Provides framework-agnostic utilities for testing `Result`-like types:

```typescript
import { GenericTestHelpers } from '../helpers/generic-test-helpers.js';

// Assertion helpers
GenericTestHelpers.assertSuccess(result);
GenericTestHelpers.assertError(result);

// Mock creation
const mockUser = GenericTestHelpers.mockRepositorySuccess(userData);
const mockError = GenericTestHelpers.mockRepositoryError('User not found');

// Test data
const testData = GenericTestHelpers.createTestData();
```

### Test App Helper (`tests/helpers/test-app.ts`)
Creates test instances of your Fastify application:

```typescript
import { createTestApp } from '../helpers/test-app.js';

const app = await createTestApp({ 
  auth: false,  // Disable authentication
  logger: false // Disable logging
});
```

### Database Helper (`tests/helpers/database.ts`)
Manages test database setup and cleanup:

```typescript
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database.js';

const testDb = await setupTestDatabase();
// ... run tests ...
await cleanupTestDatabase(testDb);
```

## 🎭 Testing Patterns

### Arrange-Act-Assert (AAA)
```typescript
it('should create user successfully', async () => {
  // 🏗️ ARRANGE - Set up test data and mocks
  const userData = { name: 'John', email: 'john@example.com' };
  const mockRepo = createMockUserRepo();
  
  // 🎯 ACT - Execute the code being tested
  const result = await userService.createUser(userData);
  
  // ✅ ASSERT - Verify the expected outcome
  expect(result.isOk()).to.be.true;
  expect(result.unwrap().name).to.equal('John');
});
```

### Mocking with Sinon
```typescript
import sinon from 'sinon';

// Create stub
const stub = sinon.stub(userRepo, 'findById');
stub.resolves(mockUser);           // Always succeed
stub.rejects(new Error('DB down')); // Always fail

// Verify calls
expect(stub.calledWith('123')).to.be.true;
expect(stub.calledOnce).to.be.true;
```

### HTTP Testing with app.inject
```typescript
// Simulate HTTP request without starting server
const response = await app.inject({
  method: 'POST',
  url: '/api/users/register',
  payload: userData,
  headers: { 'content-type': 'application/json' }
});

// Check response
expect(response.statusCode).to.equal(201);
const body = response.json();
expect(body.success).to.be.true;
```

## 🔧 Configuration

### Mocha Configuration (`.mocharc.cjs`)
```javascript
module.exports = {
  spec: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
  import: ['tsx', 'reflect-metadata'],
  timeout: 10000,
  reporter: 'spec',
  env: { NODE_ENV: 'test' }
};
```

### Test Environment Setup (`tests/setup.ts`)
- Sets `NODE_ENV=test`
- Configures mock logger and configuration service
- Registers dependencies in tsyringe container
- Provides global test utilities

## 📊 Test Coverage Strategy

### Testing Pyramid
```
    🎭 E2E Tests (Few)
   🔺🔺 Integration Tests (Some)  
  🔺🧪🧪🧪 Unit Tests (Many)
```

### Coverage Goals
- **Unit Tests**: 90%+ coverage of business logic
- **Integration Tests**: All API endpoints and database operations
- **E2E Tests**: Critical user workflows and error scenarios

## 🚨 Common Issues & Solutions

### TypeScript Import Issues
- Use `.js` extensions in import paths for ES modules
- Ensure `tsconfig.json` has correct module resolution settings

### Dependency Injection Issues
- Import `reflect-metadata` before using tsyringe
- Use `container.resolve()` in test setup

### Database Connection Issues
- Use separate test database
- Clean up data between tests
- Handle connection cleanup in `after` hooks

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear test descriptions
3. **AAA Pattern**: Organize tests with Arrange-Act-Assert
4. **Mock External Dependencies**: Don't test external services
5. **Fast Tests**: Keep unit tests under 100ms
6. **Realistic Data**: Use realistic test data that matches production
7. **Error Scenarios**: Test both success and failure cases
8. **Cleanup**: Always clean up test data and mocks

## 📚 Additional Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Sinon Testing Framework](https://sinonjs.org/)
- [Fastify Testing Guide](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) 