// Import reflect-metadata for tsyringe dependency injection
import 'reflect-metadata';

// Import and export test container for use in tests
import { testContainer } from './helpers/test-container.js';

// Set minimal environment variables for test configuration
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Export test container for use in tests
export { testContainer }; 