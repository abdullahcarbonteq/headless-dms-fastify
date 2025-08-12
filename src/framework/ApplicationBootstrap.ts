import 'reflect-metadata';
import { container } from '../infrastructure/bootstrap/container.js';
import { ILogger } from '../shared/interfaces/ILogger.js';
import { IConfigurationService } from '../shared/interfaces/IConfigurationService.js';
import { FastifyBootstrap } from './FastifyBootstrap.js';

/** Application orchestrator (startup, shutdown, and wiring) */
export class ApplicationBootstrap {
  private logger: ILogger;
  private config: IConfigurationService;
  private fastifyBootstrap: FastifyBootstrap;
  private server: any = null;

  constructor() {
    this.logger = container.resolve<ILogger>('ILogger');
    this.config = container.resolve<IConfigurationService>('IConfigurationService');
    this.fastifyBootstrap = new FastifyBootstrap(this.logger, this.config);
  }

  /** Initialize the application */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing DMS Application...');

    try {
      this.config.validate();
      this.logger.info('✅ Configuration validated successfully');

      await this.fastifyBootstrap.registerPlugins();

      await this.fastifyBootstrap.registerRoutes();

      this.logger.info('✅ Application initialization completed successfully');
    } catch (error) {
      this.logger.error('❌ Application initialization failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /** Start the application server */
  async start(): Promise<void> {
    const PORT = this.config.server.port || 3000;
    const HOST = this.config.server.host || '0.0.0.0';

    this.logger.info('🌐 Starting application server...', {
      port: PORT,
      host: HOST,
      environment: this.config.app.environment,
    });

    try {
      await this.fastifyBootstrap.start(PORT, HOST);
      this.server = this.fastifyBootstrap.getApp();

      this.logApplicationInfo();

      this.setupGracefulShutdown();

    } catch (error) {
      this.logger.error('❌ Failed to start application server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /** Stop the application server */
  async stop(): Promise<void> {
    this.logger.info('🛑 Stopping application server...');

    try {
      if (this.server) {
        await this.fastifyBootstrap.stop();
      }
      this.logger.info('✅ Application server stopped successfully');
    } catch (error) {
      this.logger.error('❌ Error stopping application server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /** Log application information */
  private logApplicationInfo(): void {
    this.logger.info('📊 Application Information', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      environment: this.config.app.environment,
      uploadDir: this.config.app.upload.uploadDir,
      maxFileSize: `${this.config.app.upload.maxFileSize / (1024 * 1024)}MB`,
      logLevel: this.config.app.logging.level,
    });
  }

  /** Setup graceful shutdown handlers */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        this.logger.error('❌ Error during graceful shutdown', error instanceof Error ? error : new Error(String(error)));
        process.exit(1);
      }
    };

    // Handle process signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      this.logger.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('❌ Unhandled Rejection:', new Error(`Promise rejected: ${reason}`), { promise: promise.toString() });
      gracefulShutdown('unhandledRejection');
    });
  }

  /** Get the Fastify instance (for testing) */
  getFastifyInstance(): any {
    return this.fastifyBootstrap.getApp();
  }
} 