import { expect } from 'chai';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-app.js';

describe('Document Search Integration', () => {
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

  describe('GET /api/documents/search', () => {
    it('should search documents with query parameter', async () => {
      // Act - Make HTTP request
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?q=test',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Check response
      expect(response.statusCode).to.equal(200);  // OK status
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.true;
      
      // Should return either array or paginated result
      if (responseBody.data && Array.isArray(responseBody.data)) {
        // Array result
        expect(responseBody.data).to.be.an('array');
      } else if (responseBody.data && responseBody.data.data) {
        // Paginated result
        expect(responseBody.data.data).to.be.an('array');
        expect(responseBody.data).to.have.property('pageNum');
        expect(responseBody.data).to.have.property('pageSize');
        expect(responseBody.data).to.have.property('totalPages');
      }
    });

    it('should handle pagination parameters', async () => {
      // Act - Search with pagination
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?q=test&page=1&limit=10',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Check response
      expect(response.statusCode).to.equal(200);
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.true;
      
      // Should return paginated result
      expect(responseBody.data).to.have.property('data');
      expect(responseBody.data).to.have.property('pageNum');
      expect(responseBody.data).to.have.property('pageSize');
      expect(responseBody.data).to.have.property('totalPages');
    });

    it('should handle invalid pagination parameters', async () => {
      // Act - Search with invalid pagination
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?q=test&page=invalid&limit=invalid',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Should fail validation
      expect(response.statusCode).to.equal(400);  // Bad request
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.false;
      expect(responseBody.error).to.include('validation');
    });

    it('should handle empty search query', async () => {
      // Act - Search with empty query
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/search?q=',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Should handle empty query gracefully
      expect(response.statusCode).to.equal(200);
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.true;
    });
  });

  describe('GET /api/documents/all', () => {
    it('should get all documents', async () => {
      // Act - Get all documents
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/all',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Check response
      expect(response.statusCode).to.equal(200);
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.true;
      
      // Should return either array or paginated result
      if (responseBody.data && Array.isArray(responseBody.data)) {
        expect(responseBody.data).to.be.an('array');
      } else if (responseBody.data && responseBody.data.data) {
        expect(responseBody.data.data).to.be.an('array');
      }
    });

    it('should handle pagination for all documents', async () => {
      // Act - Get all documents with pagination
      const response = await app.inject({
        method: 'GET',
        url: '/api/documents/all?page=1&limit=5',
        headers: {
          'content-type': 'application/json'
        }
      });

      // Assert - Check response
      expect(response.statusCode).to.equal(200);
      
      const responseBody = response.json();
      expect(responseBody.success).to.be.true;
      
      // Should return paginated result
      expect(responseBody.data).to.have.property('data');
      expect(responseBody.data).to.have.property('pageNum');
      expect(responseBody.data).to.have.property('pageSize');
      expect(responseBody.data).to.have.property('totalPages');
    });
  });
}); 