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
import { RequestContextService } from './services/RequestContextService.js';
import { closeDatabase, pingDatabase } from '../infrastructure/persistence/db.js';

  /** Fastify framework bootstrapping (kept framework concerns isolated) */
export class FastifyBootstrap {
  private app: FastifyInstance;
  private logger: ILogger;
  private config: IConfigurationService;

  constructor(logger: ILogger, config: IConfigurationService) {
    this.logger = logger;
    this.config = config;
    this.app = this.createFastifyInstance();
  }

  /** Create and configure Fastify instance */
  private createFastifyInstance(): FastifyInstance {
    const app = Fastify({
      logger: false, // We use our own logger
      trustProxy: true, // Trust proxy headers for load balancers
      connectionTimeout: 30000, // 30 seconds
      keepAliveTimeout: 5000, // 5 seconds
      maxRequestsPerSocket: 100, // Limit requests per connection
      disableRequestLogging: true, // We handle logging ourselves
    });

    app.addHook('onClose', async (instance) => {
      this.logger.info('🛑 Fastify app closing...');
      
      // Add actual cleanup logic here
      try {
        // Close database connections
        await closeDatabase();
        
        // Cleanup file handles
        // await this.cleanupFileHandles();
        
        // Release other resources
        // await this.releaseResources();
        
        this.logger.info('✅ Fastify cleanup completed');
      } catch (error) {
        this.logger.error('❌ Error during Fastify cleanup', error instanceof Error ? error : new Error(String(error)));
      }
    });

    app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
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

  /** Register plugins and middleware */
  async registerPlugins(): Promise<void> {
    this.logger.info('🔌 Registering Fastify plugins...');

    await this.app.register(cors, {
      origin: this.config.app.cors.origin,
      credentials: this.config.app.cors.credentials,
    });

    await this.app.register(jwt, { 
      secret: this.config.jwt.secret 
    });

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

    await this.app.register(multipart, {
      limits: {
        fileSize: this.config.app.upload.maxFileSize,
        files: this.config.app.upload.maxFiles,
      },
      attachFieldsToBody: false,
    });

    await this.app.register(fastifyStatic, {
      // Serve files from project root's upload directory to align with FileSystemStorageAdapter
      root: join(process.cwd(), this.config.app.upload.uploadDir),
      prefix: '/uploads/',
      decorateReply: false,
      cacheControl: true,
      etag: true,
      lastModified: true,
    });

    this.logger.info('✅ Fastify plugins registered successfully');
  }

  /** Register routes */
  async registerRoutes(): Promise<void> {
    this.logger.info('🛣️ Registering application routes...');

    // Import routes dynamically (presentation layer)
    const { default: documentRoutes } = await import('../presentation/http/document.routes.js');
    const { default: userRoutes } = await import('../presentation/http/user.routes.js');

    await this.app.register(documentRoutes, { prefix: '/api/documents' });
    await this.app.register(userRoutes, { prefix: '/api/users' });

    this.app.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
      };
    });

    this.app.get('/ready', async (request, reply) => {
      const dbOk = await pingDatabase();
      const ok = dbOk;
      return {
        status: ok ? 'ready' : 'degraded',
        checks: { database: dbOk },
        timestamp: new Date().toISOString(),
      };
    });

    this.logger.info('✅ Application routes registered successfully');
  }

  /** Get the configured Fastify instance */
  getApp(): FastifyInstance {
    return this.app;
  }

  /** Start the server */
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

  /** Stop the server */
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