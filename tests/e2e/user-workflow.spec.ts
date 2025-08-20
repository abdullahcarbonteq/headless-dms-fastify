import { expect } from 'chai';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-app.js';

describe('User Workflow E2E', () => {
  let app: FastifyInstance;

  // Setup test environment
  before(async () => {
    // Create test app without database for now
    app = await createTestApp({ auth: false });
  });

  after(async () => {
    // Clean up
    await app.close();
  });

  describe('Complete User Lifecycle', () => {
    it('should complete full user workflow from registration to deletion', async () => {
      // 🏗️ STEP 1: Register a new user
      console.log('📝 Step 1: Registering new user...');
      
      const userData = {
        name: 'E2E Test User',
        email: 'e2e-test@example.com',
        password: 'secret123',
        role: 'user'
      };

      const registerResponse = await app.inject({
        method: 'POST',
        url: '/api/users/register',
        payload: userData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Verify registration succeeded
      expect(registerResponse.statusCode).to.equal(201);
      const registerBody = registerResponse.json();
      expect(registerBody.success).to.be.true;
      expect(registerBody.data).to.have.property('id');
      expect(registerBody.data.name).to.equal('E2E Test User');
      expect(registerBody.data.email).to.equal('e2e-test@example.com');
      expect(registerBody.data.role).to.equal('user');
      
      const userId = registerBody.data.id;
      console.log(`✅ User registered with ID: ${userId}`);

      // 🏗️ STEP 2: Login with the new user
      console.log('🔐 Step 2: Logging in with new user...');
      
      const loginData = {
        email: 'e2e-test@example.com',
        password: 'secret123'
      };

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/users/login',
        payload: loginData,
        headers: {
          'content-type': 'application/json'
        }
      });

      // Verify login succeeded
      expect(loginResponse.statusCode).to.equal(200);
      const loginBody = loginResponse.json();
      expect(loginBody.success).to.be.true;
      expect(loginBody.data).to.have.property('token');
      expect(loginBody.data).to.have.property('user');
      expect(loginBody.data.user.id).to.equal(userId);
      
      const authToken = loginBody.data.token;
      console.log('✅ User logged in successfully');

      // 🏗️ STEP 3: Get user profile
      console.log('👤 Step 3: Getting user profile...');
      
      const profileResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
        headers: {
          'authorization': `Bearer ${authToken}`,
          'content-type': 'application/json'
        }
      });

      // Verify profile retrieval succeeded
      expect(profileResponse.statusCode).to.equal(200);
      const profileBody = profileResponse.json();
      expect(profileBody.success).to.be.true;
      expect(profileBody.data.id).to.equal(userId);
      expect(profileBody.data.name).to.equal('E2E Test User');
      console.log('✅ User profile retrieved successfully');

      // 🏗️ STEP 4: Update user profile
      console.log('✏️ Step 4: Updating user profile...');
      
      const updateData = {
        name: 'Updated E2E Test User',
        email: 'updated-e2e-test@example.com'
      };

      const updateResponse = await app.inject({
        method: 'PUT',
        url: `/api/users/${userId}`,
        payload: updateData,
        headers: {
          'authorization': `Bearer ${authToken}`,
          'content-type': 'application/json'
        }
      });

      // Verify update succeeded
      expect(updateResponse.statusCode).to.equal(200);
      const updateBody = updateResponse.json();
      expect(updateBody.success).to.be.true;
      expect(updateBody.data.name).to.equal('Updated E2E Test User');
      expect(updateBody.data.email).to.equal('updated-e2e-test@example.com');
      console.log('✅ User profile updated successfully');

      // 🏗️ STEP 5: Verify updated profile
      console.log('🔍 Step 5: Verifying updated profile...');
      
      const verifyResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
        headers: {
          'authorization': `Bearer ${authToken}`,
          'content-type': 'application/json'
        }
      });

      // Verify profile was actually updated
      expect(verifyResponse.statusCode).to.equal(200);
      const verifyBody = verifyResponse.json();
      expect(verifyBody.success).to.be.true;
      expect(verifyBody.data.name).to.equal('Updated E2E Test User');
      expect(verifyBody.data.email).to.equal('updated-e2e-test@example.com');
      console.log('✅ Profile update verified successfully');

      // 🏗️ STEP 6: Delete the user
      console.log('🗑️ Step 6: Deleting user...');
      
      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/users/${userId}`,
        headers: {
          'authorization': `Bearer ${authToken}`
        }
      });

      // Verify deletion succeeded
      expect(deleteResponse.statusCode).to.equal(200);
      const deleteBody = deleteResponse.json();
      expect(deleteBody.success).to.be.true;
      expect(deleteBody.data).to.be.true;
      console.log('✅ User deleted successfully');

      // 🏗️ STEP 7: Verify user is gone
      console.log('🔍 Step 7: Verifying user is deleted...');
      
      const verifyDeletedResponse = await app.inject({
        method: 'GET',
        url: `/api/users/${userId}`,
        headers: {
          'authorization': `Bearer ${authToken}`,
          'content-type': 'application/json'
        }
      });

      // Verify user no longer exists
      expect(verifyDeletedResponse.statusCode).to.equal(404);
      const verifyDeletedBody = verifyDeletedResponse.json();
      expect(verifyDeletedBody.success).to.be.false;
      expect(verifyDeletedBody.error).to.include('not found');
      console.log('✅ User deletion verified successfully');

      console.log('🎉 Complete user workflow test passed!');
    });
  });

  describe('Error Handling E2E', () => {
    it('should handle authentication errors correctly', async () => {
      // Try to access protected endpoint without token
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          'content-type': 'application/json'
        }
        // No authorization header!
      });

      expect(response.statusCode).to.equal(401);  // Unauthorized
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('token');
    });

    it('should handle invalid token correctly', async () => {
      // Try to access protected endpoint with invalid token
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/123e4567-e89b-12d3-a456-426614174000',
        headers: {
          'authorization': 'Bearer invalid-token-here',
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).to.equal(401);  // Unauthorized
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('Invalid token');
    });

    it('should handle not found errors correctly', async () => {
      // Try to access non-existent user with valid auth
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/00000000-0000-0000-0000-000000000000',
        headers: {
          'authorization': 'Bearer valid-token-for-testing',
          'content-type': 'application/json'
        }
      });

      expect(response.statusCode).to.equal(404);  // Not found
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('not found');
    });
  });
}); 