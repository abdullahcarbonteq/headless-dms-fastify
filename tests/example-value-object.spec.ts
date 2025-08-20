import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { 
  assertSuccess, 
  assertError, 
  mockSuccess, 
  mockError,
  createTestData 
} from './helpers/generic-test-helpers.js';

// Simple mock value object for testing
class MockValueObject {
  constructor(private value: string) {}

  static create(value: string): any {
    if (!value || value.trim().length === 0) {
      return mockError({ message: 'Value cannot be empty' });
    }
    return mockSuccess(new MockValueObject(value));
  }

  getValue(): string {
    return this.value;
  }

  validate(): boolean {
    return this.value.length > 0;
  }
}

describe('Example Value Object Tests (Generic Testing)', () => {
  let testData: any;

  beforeEach(() => {
    testData = createTestData();
  });

  describe('Creation', () => {
    it('should create a valid value object', () => {
      const result = MockValueObject.create('test-value');
      assertSuccess(result);
      const vo = result.unwrap();
      expect(vo.getValue()).to.equal('test-value');
    });

    it('should reject empty values', () => {
      const result = MockValueObject.create('');
      assertError(result, 'Value cannot be empty');
    });

    it('should reject whitespace-only values', () => {
      const result = MockValueObject.create('   ');
      assertError(result, 'Value cannot be empty');
    });
  });

  describe('Validation', () => {
    it('should validate non-empty values', () => {
      const vo = new MockValueObject('valid-value');
      expect(vo.validate()).to.be.true;
    });

    it('should not validate empty values', () => {
      const vo = new MockValueObject('');
      expect(vo.validate()).to.be.false;
    });
  });

  describe('Test Helpers', () => {
    it('should work with mock success results', () => {
      const result = mockSuccess('test-data');
      assertSuccess(result, 'test-data');
    });

    it('should work with mock error results', () => {
      const result = mockError({ message: 'Test error' });
      assertError(result, 'Test error');
    });

    it('should create test data', () => {
      expect(testData.user).to.have.property('id');
      expect(testData.user).to.have.property('name');
      expect(testData.document).to.have.property('filename');
    });
  });
}); 