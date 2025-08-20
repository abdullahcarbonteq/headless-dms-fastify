import { expect } from 'chai';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-app.js';

describe('User Registration Integration', () => {
  let app: FastifyInstance;

  // Setup test environment
  before(async () => {
    // Create test app without database for now (we'll add that later)
    app = await createTestApp({ auth: false });
  });

  after(async () => {
    // Clean up
    await app.close();
  });

  describe('POST /api/users/register', () => {
    it('should register user successfully', async () => {
      // Arrange - Prepare test data
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'user'
      };

      // Act - Make HTTP request using app.inject
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: userData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Check HTTP response
      expect(response.statusCode).to.equal(201);  // Created status
      
      // Parse response body
      const responseBody = response.json();
      
      // Check response structure (this comes from your API!)
      expect(responseBody.success).to.be.true;    // Success flag
      expect(responseBody.data).to.have.property('id');  // Data object
      expect(responseBody.data.name).to.equal('John Doe');
      expect(responseBody.data.email).to.equal('john@example.com');
      expect(responseBody.data.role).to.equal('user');
    });

    it('should reject invalid email format', async () => {
      // Arrange - Invalid email
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',  // Invalid email format
        password: 'secret123',
        role: 'user'
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: userData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Should fail validation
      expect(response.statusCode).to.equal(400);  // Bad request
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('email');
    });

    it('should reject empty name', async () => {
      // Arrange - Empty name
      const userData = {
        name: '',  // Empty name
        email: 'john@example.com',
        password: 'secret123',
        role: 'user'
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: userData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Should fail validation
      expect(response.statusCode).to.equal(400);  // Bad request
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('name');
    });

    it('should reject invalid role', async () => {
      // Arrange - Invalid role
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        role: 'invalid-role'  // Invalid role
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: userData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Should fail validation
      expect(response.statusCode).to.equal(400);  // Bad request
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('role');
    });
  });
}); 