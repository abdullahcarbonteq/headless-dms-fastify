import { expect } from 'chai';
import { FastifyInstance } from 'fastify';
import { createTestApp } from '../helpers/test-app.js';

describe('Test App Helper', () => {
  let app: FastifyInstance;

  after(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create test app successfully', async () => {
    // Act
    app = await createTestApp();

    // Assert
    expect(app).to.exist;
    expect(typeof app.inject).to.equal('function');
  });

  it('should respond to test endpoint', async () => {
    // Arrange
    app = await createTestApp();

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test'
    });

    // Assert
    expect(response.statusCode).to.equal(200);
    const body = response.json();
    expect(body.message).to.equal('Test app is working');
  });

  it('should handle authentication mock when disabled', async () => {
    // Arrange
    app = await createTestApp({ auth: false });

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/test'
    });

    // Assert
    expect(response.statusCode).to.equal(200);
  });
}); 