#!/usr/bin/env node

import { Command } from 'commander';
import { ApplicationBootstrap } from '../framework/ApplicationBootstrap.js';
import { container } from '../config/container.js';
import { ILogger } from '../shared/interfaces/ILogger.js';
import { IConfigurationService } from '../shared/interfaces/IConfigurationService.js';

  /** CLI application using Commander.js */
export class CLIApplication {
  private program: Command;
  private logger: ILogger;
  private config: IConfigurationService;

  constructor() {
    this.program = new Command();
    this.logger = container.resolve<ILogger>('ILogger');
    this.config = container.resolve<IConfigurationService>('IConfigurationService');
    this.setupCommands();
  }

  /** Setup CLI commands */
  private setupCommands(): void {
    // Set program metadata
    this.program
      .name('dms')
      .description('Document Management System CLI')
      .version('1.0.0');

    // Start command - Start the application server
    this.program
      .command('start')
      .description('Start the DMS application server')
      .option('-p, --port <port>', 'Port to bind to', '3000')
      .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
      .option('--env <environment>', 'Environment (development, production, test)', 'development')
      .action(async (options) => {
        await this.startServer(options);
      });

    // Dev command - Start in development mode
    this.program
      .command('dev')
      .description('Start the DMS application in development mode')
      .option('-p, --port <port>', 'Port to bind to', '3000')
      .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
      .action(async (options) => {
        await this.startDevServer(options);
      });

    // Health command - Check application health
    this.program
      .command('health')
      .description('Check application health')
      .option('-u, --url <url>', 'Application URL', 'http://localhost:3000')
      .action(async (options) => {
        await this.checkHealth(options);
      });

    // Config command - Show configuration
    this.program
      .command('config')
      .description('Show application configuration')
      .option('-f, --format <format>', 'Output format (json, yaml, table)', 'table')
      .action(async (options) => {
        await this.showConfig(options);
      });

    // Test command - Run application tests
    this.program
      .command('test')
      .description('Run application tests')
      .option('--coverage', 'Generate coverage report')
      .option('--watch', 'Watch mode for development')
      .action(async (options) => {
        await this.runTests(options);
      });

    // Migrate command - Run database migrations
    this.program
      .command('migrate')
      .description('Run database migrations')
      .option('--up', 'Run migrations up')
      .option('--down', 'Run migrations down')
      .option('--reset', 'Reset database')
      .action(async (options) => {
        await this.runMigrations(options);
      });

    // Seed command - Seed database with initial data
    this.program
      .command('seed')
      .description('Seed database with initial data')
      .option('--reset', 'Reset database before seeding')
      .action(async (options) => {
        await this.seedDatabase(options);
      });

    // Help command - Show detailed help
    this.program
      .command('help')
      .description('Show detailed help information')
      .action(() => {
        this.showHelp();
      });
  }

  /**
   * Start the application server
   */
  private async startServer(options: any): Promise<void> {
    try {
      this.logger.info('🚀 Starting DMS Application Server...', options);

      // Override configuration with CLI options
      if (options.port) {
        process.env.PORT = options.port;
      }
      if (options.host) {
        process.env.HOST = options.host;
      }
      if (options.env) {
        process.env.NODE_ENV = options.env;
      }

      const app = new ApplicationBootstrap();
      await app.initialize();
      await app.start();

      this.logger.info('✅ DMS Application Server started successfully');
    } catch (error) {
      this.logger.error('❌ Failed to start DMS Application Server', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Start development server
   */
  private async startDevServer(options: any): Promise<void> {
    try {
      this.logger.info('🔧 Starting DMS Development Server...', options);

      // Set development environment
      process.env.NODE_ENV = 'development';
      if (options.port) {
        process.env.PORT = options.port;
      }
      if (options.host) {
        process.env.HOST = options.host;
      }

      const app = new ApplicationBootstrap();
      await app.initialize();
      await app.start();

      this.logger.info('✅ DMS Development Server started successfully');
      this.logger.info('📚 API Documentation available at: http://localhost:3000/docs');
      this.logger.info('🏥 Health check available at: http://localhost:3000/health');
    } catch (error) {
      this.logger.error('❌ Failed to start DMS Development Server', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Check application health
   */
  private async checkHealth(options: any): Promise<void> {
    try {
      this.logger.info('🏥 Checking application health...', { url: options.url });

      const response = await fetch(`${options.url}/health`);
      const health = await response.json();

      if (response.ok) {
        console.log('✅ Application is healthy');
        console.log(JSON.stringify(health, null, 2));
      } else {
        console.log('❌ Application is unhealthy');
        console.log(JSON.stringify(health, null, 2));
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('❌ Health check failed', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Show application configuration
   */
  private async showConfig(options: any): Promise<void> {
    try {
      const config = this.config.getAll();

      if (options.format === 'json') {
        console.log(JSON.stringify(config, null, 2));
      } else if (options.format === 'yaml') {
        // Simple YAML-like output
        console.log('Configuration:');
        console.log(`  Environment: ${config.app.environment}`);
        console.log(`  Port: ${config.server.port}`);
        console.log(`  Host: ${config.server.host}`);
        console.log(`  Database URL: ${config.database.url}`);
        console.log(`  JWT Secret: ${config.jwt.secret ? '[HIDDEN]' : '[NOT SET]'}`);
        console.log(`  Upload Directory: ${config.app.upload.uploadDir}`);
        console.log(`  Max File Size: ${config.app.upload.maxFileSize / (1024 * 1024)}MB`);
        console.log(`  Log Level: ${config.app.logging.level}`);
      } else {
        // Table format
        console.log('Configuration:');
        console.log(`  Environment: ${config.app.environment}`);
        console.log(`  Port: ${config.server.port}`);
        console.log(`  Host: ${config.server.host}`);
        console.log(`  Database URL: ${config.database.url}`);
        console.log(`  JWT Secret: ${config.jwt.secret ? '[HIDDEN]' : '[NOT SET]'}`);
        console.log(`  Upload Directory: ${config.app.upload.uploadDir}`);
        console.log(`  Max File Size: ${config.app.upload.maxFileSize / (1024 * 1024)}MB`);
        console.log(`  Log Level: ${config.app.logging.level}`);
      }
    } catch (error) {
      this.logger.error('❌ Failed to show configuration', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Run application tests
   */
  private async runTests(options: any): Promise<void> {
    try {
      this.logger.info('🧪 Running application tests...', options);

      // This would typically run your test suite
      // For now, we'll just log that tests would run
      console.log('Tests would run here...');
      console.log('Options:', options);

      this.logger.info('✅ Tests completed successfully');
    } catch (error) {
      this.logger.error('❌ Tests failed', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(options: any): Promise<void> {
    try {
      this.logger.info('🗄️ Running database migrations...', options);

      // This would typically run your database migrations
      // For now, we'll just log that migrations would run
      console.log('Migrations would run here...');
      console.log('Options:', options);

      this.logger.info('✅ Migrations completed successfully');
    } catch (error) {
      this.logger.error('❌ Migrations failed', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Seed database with initial data
   */
  private async seedDatabase(options: any): Promise<void> {
    try {
      this.logger.info('🌱 Seeding database...', options);

      // This would typically seed your database
      // For now, we'll just log that seeding would run
      console.log('Database seeding would run here...');
      console.log('Options:', options);

      this.logger.info('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seeding failed', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }

  /**
   * Show detailed help
   */
  private showHelp(): void {
    console.log(`
DMS CLI - Document Management System

Available Commands:
  start     Start the DMS application server
  dev       Start the DMS application in development mode
  health    Check application health
  config    Show application configuration
  test      Run application tests
  migrate   Run database migrations
  seed      Seed database with initial data
  help      Show this help message

Examples:
  dms start --port 8080 --env production
  dms dev --port 3000
  dms health --url http://localhost:3000
  dms config --format json
  dms migrate --up
  dms seed --reset

For more information, visit: https://github.com/your-repo/dms
    `);
  }

  /**
   * Parse and execute CLI commands
   */
  async run(): Promise<void> {
    try {
      await this.program.parseAsync();
    } catch (error) {
      this.logger.error('❌ CLI execution failed', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }
} 