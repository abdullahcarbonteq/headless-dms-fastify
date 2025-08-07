import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ILogger } from '../shared/interfaces/ILogger.js';
import { IConfigurationService } from '../shared/interfaces/IConfigurationService.js';
import { RequestContextService } from '../shared/services/RequestContextService.js';

/**
 * Fastify Framework Bootstrap
 * 
 * 12 FACTOR APP: Entry Point Separation
 * Separates HTTP framework bootstrapping from business logic
 * Makes the application more modular and testable
 */
export class FastifyBootstrap {
  private app: FastifyInstance;
  private logger: ILogger;
  private config: IConfigurationService;

  constructor(logger: ILogger, config: IConfigurationService) {
    this.logger = logger;
    this.config = config;
    this.app = this.createFastifyInstance();
  }

  /**
   * Create and configure Fastify instance
   */
  private createFastifyInstance(): FastifyInstance {
    // 12 FACTOR APP: Concurrency - Scale out via the process model
    const app = Fastify({
      // 12 FACTOR APP: Concurrency - Configure for horizontal scaling
      logger: false, // We use our own logger
      trustProxy: true, // Trust proxy headers for load balancers
      connectionTimeout: 30000, // 30 seconds
      keepAliveTimeout: 5000, // 5 seconds
      maxRequestsPerSocket: 100, // Limit requests per connection
      disableRequestLogging: true, // We handle logging ourselves
    });

    // 12 FACTOR APP: Concurrency - Handle graceful shutdown
    app.addHook('onClose', async (instance) => {
      this.logger.info('🛑 Fastify app closing...');
      
      // Add actual cleanup logic here
      try {
        // Close database connections
        // await this.closeDatabaseConnections();
        
        // Cleanup file handles
        // await this.cleanupFileHandles();
        
        // Release other resources
        // await this.releaseResources();
        
        this.logger.info('✅ Fastify cleanup completed');
      } catch (error) {
        this.logger.error('❌ Error during Fastify cleanup', error instanceof Error ? error : new Error(String(error)));
      }
    });

    // 12 FACTOR APP: Concurrency - Add request lifecycle hooks
    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
      // Initialize request context with proper typing
      RequestContextService.initializeRequestContext(request);
      
      // Log request start (only if not a health check)
      if (RequestContextService.shouldLogRequest(request)) {
        this.logger.info(`📥 Request started`, {
          requestId: request.id,
          method: request.method,
          url: request.url,
          clientIp: request.clientIp,
          userAgent: request.userAgent,
        });
      }
    });

    app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
      // Finalize request context and calculate metrics
      RequestContextService.finalizeRequestContext(request, reply);
      
      // Log request completion (only if not a health check)
      if (RequestContextService.shouldLogRequest(request)) {
        const logMessage = RequestContextService.createLogMessage(request, reply);
        const metadata = RequestContextService.getRequestMetadata(request, reply);
        
        this.logger.info(`📤 ${logMessage}`, metadata);
      }
    });

    return app;
  }

  /**
   * Register all plugins and middleware
   */
  async registerPlugins(): Promise<void> {
    this.logger.info('🔌 Registering Fastify plugins...');

    // CORS
    await this.app.register(cors, {
      origin: this.config.app.cors.origin,
      credentials: this.config.app.cors.credentials,
    });

    // JWT
    await this.app.register(jwt, { 
      secret: this.config.jwt.secret 
    });

    // Swagger Documentation
    await this.app.register(swagger, {
      swagger: {
        info: {
          title: 'DMS API',
          description: 'API for Document Management System',
          version: '1.0.0',
        },
      },
    });

    await this.app.register(swaggerUI, {
      routePrefix: '/docs',
    });

    // Multipart for file uploads
    await this.app.register(multipart, {
      limits: {
        fileSize: this.config.app.upload.maxFileSize,
        files: this.config.app.upload.maxFiles,
      },
      attachFieldsToBody: false,
    });

    // Static file serving
    await this.app.register(fastifyStatic, {
      root: join(dirname(fileURLToPath(import.meta.url)), '..', '..', this.config.app.upload.uploadDir),
      prefix: '/uploads/',
      // 12 FACTOR APP: Concurrency - Configure static file serving for concurrency
      decorateReply: false,
      cacheControl: true,
      etag: true,
      lastModified: true,
    });

    this.logger.info('✅ Fastify plugins registered successfully');
  }

  /**
   * Register all routes
   */
  async registerRoutes(): Promise<void> {
    this.logger.info('🛣️ Registering application routes...');

    // Import routes dynamically
    const { default: documentRoutes } = await import('../modules/document/document.routes.js');
    const { default: userRoutes } = await import('../modules/user/user.routes.js');

    // Register routes
    await this.app.register(documentRoutes, { prefix: '/api/documents' });
    await this.app.register(userRoutes, { prefix: '/api/users' });

    // 12 FACTOR APP: Concurrency - Health check endpoint for load balancers
    this.app.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
      };
    });

    // 12 FACTOR APP: Concurrency - Ready check endpoint
    this.app.get('/ready', async (request, reply) => {
      // Check if the app is ready to handle requests
      // In a real app, you'd check database connectivity, etc.
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    });

    this.logger.info('✅ Application routes registered successfully');
  }

  /**
   * Get the configured Fastify instance
   */
  getApp(): FastifyInstance {
    return this.app;
  }

  /**
   * Start the server
   */
  async start(port: number, host: string): Promise<void> {
    try {
      await this.app.listen({ port, host });
      this.logger.info('🚀 Fastify server started successfully', {
        port,
        host,
        environment: this.config.app.environment,
      });
    } catch (error) {
      this.logger.error('❌ Failed to start Fastify server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    try {
      await this.app.close();
      this.logger.info('✅ Fastify server stopped successfully');
    } catch (error) {
      this.logger.error('❌ Error stopping Fastify server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
} 