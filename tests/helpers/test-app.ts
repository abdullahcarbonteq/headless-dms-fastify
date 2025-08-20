import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import { registerTestRoutes } from './test-routes.js';
import { registerTestPlugins } from './test-plugins.js';

export interface TestAppOptions {
  logger?: boolean;
  auth?: boolean;
}

export async function createTestApp(options: TestAppOptions = {}): Promise<FastifyInstance> {
  // Create Fastify instance with test configuration
  const app = Fastify({
    logger: options.logger !== false ? false : true,  // Disable logging in tests
    ajv: {
      customOptions: {
        removeAdditional: 'all',  // Remove extra properties
        coerceTypes: true,        // Convert types automatically
        useDefaults: true         // Use default values
      }
    }
  });

  // Register test-specific plugins
  await app.register(async (fastify) => {
    // Disable real authentication in tests if requested
    if (options.auth === false) {
      fastify.addHook('onRequest', async (request, reply) => {
        // Mock authentication for testing
        (request as any).user = {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'admin'
        };
      });
    }
  });

  // Register test-specific plugins
  await registerTestPlugins(app);
  
  // Register test-specific routes
  await registerTestRoutes(app);

  // Add test-specific error handling with detailed logging
  app.setErrorHandler((error, request, reply) => {
    // Log detailed error information for debugging
    console.error('=== TEST ERROR DETAILS ===');
    console.error('Error:', error);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Request URL:', request.url);
    console.error('Request Method:', request.method);
    console.error('Request Headers:', request.headers);
    console.error('Request Body:', request.body);
    console.error('========================');
    
    // Return error response
    reply.status(500).send({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        stack: error.stack
      }
    });
  });

  // Add a simple test route to verify the app works
  app.get('/test', async (request, reply) => {
    return { message: 'Test app is working' };
  });

  return app;
}

// Convenience function for common test scenarios
export async function createAuthenticatedTestApp(): Promise<FastifyInstance> {
  return createTestApp({
    logger: false,
    auth: true  // Enable authentication
  });
}

export async function createUnauthenticatedTestApp(): Promise<FastifyInstance> {
  return createTestApp({
    logger: false,
    auth: false  // Disable authentication
  });
} 