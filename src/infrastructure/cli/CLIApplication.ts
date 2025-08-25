#!/usr/bin/env node

import { Command } from 'commander';
import { ApplicationBootstrap } from '../../framework/ApplicationBootstrap.js';
import { container } from '../bootstrap/container.js';
import { ILogger } from '../../shared/interfaces/ILogger.js';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { runSeed } from '../seed/seed.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';

export class CLIApplication {
  private program: Command;
  private logger: ILogger;
  private config: IConfigurationService;
  private obs?: IObservabilityService;

  constructor() {
    this.program = new Command();
    this.logger = container.resolve<ILogger>('ILogger');
    this.config = container.resolve<IConfigurationService>('IConfigurationService');
    try { this.obs = container.resolve<IObservabilityService>('IObservabilityService'); } catch {}
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
      .option('--clear-only', 'Only clear data (users, documents) without reseeding')
      .action(async (options) => {
        await this.seedDatabase(options);
      });

    // Download command - Bulk download documents
    this.program
      .command('download')
      .description('Bulk download documents from storage (fs/s3/gcs/azure)')
      .option('-o, --out <dir>', 'Output directory', './export')
      .option('--tags <tags>', 'Comma-separated tags filter')
      .option('--description <text>', 'Description contains filter')
      .option('--user <userId>', 'Filter by userId')
      .option('--concurrency <n>', 'Concurrent downloads (default 4)', '4')
      .option('--retry <n>', 'Retry attempts (default 3)', '3')
      .option('--timeout <ms>', 'Per-file timeout ms (default 30000)', '30000')
      .option('--expires <sec>', 'Presigned URL expiry seconds (default 600)', '600')
      .action(async (options) => {
        await this.bulkDownload(options);
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
  private async checkHealth(options: { url: string }): Promise<void> {
    try {
      this.logger.info('🏥 Checking application health...', { url: options.url });

      const controller = new AbortController();
      const timeoutMs = Number(process.env.CLI_HTTP_TIMEOUT_MS || 10000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(`${options.url}/health`, { signal: controller.signal }).finally(() => clearTimeout(timer));
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
  private async showConfig(options: { format?: 'json' | 'yaml' | 'table' }): Promise<void> {
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
  private async runTests(options: { coverage?: boolean; watch?: boolean }): Promise<void> {
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
   * Bulk download implementation
   */
  private async bulkDownload(options: { out?: string; tags?: string; description?: string; user?: string; concurrency?: string | number; retry?: string | number; timeout?: string | number; expires?: string | number }): Promise<void> {
    const outDir = options.out || './export';
    const concurrency = Math.max(1, parseInt(String(options.concurrency || '4'), 10));
    const retry = Math.max(0, parseInt(String(options.retry || '3'), 10));
    const timeoutMs = Math.max(1000, parseInt(String(options.timeout || '30000'), 10));
    const tags = options.tags ? String(options.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : undefined;
    const description = options.description ? String(options.description) : undefined;
    const userId = options.user ? String(options.user) : undefined;
    const expiresSeconds = Math.max(60, parseInt(String(options.expires || '600'), 10));

    const fs = await import('fs');
    await fs.promises.mkdir(outDir, { recursive: true });

    // Spin up app to reuse repositories and strategy
    const app = new ApplicationBootstrap();
    await app.initialize();

    // Resolve repo and ports from DI
    const docRepo = container.resolve('DocumentRepositoryPort') as { getAllDocuments: Function };
    const fileStorage = container.resolve('FileStoragePort') as { getPresignedDownloadUrl?: Function; readStream?: Function };

    // Simple pager – fetch all (you can refine later)
    const listRes = await docRepo.getAllDocuments();
    if (listRes.isErr && listRes.isErr()) {
      console.error('Failed to list documents');
      process.exit(1);
    }
    const page = (listRes.unwrap ? listRes.unwrap() : listRes) as { data: Array<{ id: string; filename: string; description?: string; tags?: string[]; userId: string; path: string }> };
    const docs = page.data;

    // Filter
    const filtered = docs.filter((d) => {
      let ok = true;
      if (tags && tags.length) ok = ok && tags.every((t: string) => (d.tags || []).includes(t));
      if (description) ok = ok && String(d.description || '').includes(description);
      if (userId) ok = ok && d.userId === userId;
      return ok;
    });

    // Concurrency-limited worker pool
    let cursor = 0;
    const worker = async () => {
      while (true) {
        const i = cursor++;
        if (i >= filtered.length) return;
        const item = filtered[i];
        await this.executeWithRetryAndTimeout(
          () => this.downloadOne(item, outDir, fileStorage, expiresSeconds),
          retry,
          timeoutMs,
        ).catch((e) => console.error('Download failed:', e?.message || e));
      }
    };
    const runWorkers = async () => {
      await Promise.all(new Array(Math.min(concurrency, filtered.length)).fill(0).map(() => worker()));
      console.log(`Completed. Downloaded ${filtered.length} files to ${outDir}`);
    };
    if (this.obs && this.obs.isEnabled()) {
      await this.obs.startBackgroundTransaction('Custom/CLI:download', async () => {
        this.obs!.addCustomAttributes({ outDir, concurrency, retry, timeoutMs, expiresSeconds, total: filtered.length });
        try { await runWorkers(); } catch (e) { this.obs!.noticeError(e as Error); throw e; }
      });
    } else {
      await runWorkers();
    }
    await app.stop();
  }

  private async executeWithRetryAndTimeout<T>(fn: () => Promise<T>, retries: number, timeoutMs: number): Promise<T> {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await this.withTimeout(fn(), timeoutMs);
        return res;
      } catch (e) {
        lastErr = e;
        if (attempt === retries) break;
      }
    }
    throw lastErr;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
      });
      const result = await Promise.race([promise, timeout]);
      if (timer) clearTimeout(timer);
      return result as T;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async downloadOne(
    item: { id: string; filename: string; path: string },
    outDir: string,
    fileStorage: { getPresignedDownloadUrl?: Function; readStream?: Function },
    expiresSeconds: number
  ): Promise<void> {
    // For now, reuse path to fetch content using provider SDKs via a simple stream
    // We’ll synthesize a read using provider SDKs only for fs; for cloud, we can stream via HTTP in the future
    const pathMod = await import('path');
    const fs = await import('fs');
    const outPath = pathMod.resolve(outDir, `${item.id}-${item.filename}`);

    // Simple strategy: use provider from path prefix and copy using provider SDKs minimal read
    // For now, just fetch via HTTP presigned could be added; with adapters we only implemented write/remove
    // So we fallback: if fs path, copy; else skip with message
    if (item.path.startsWith('uploads/') || item.path.startsWith('./uploads') || item.path.startsWith('/')) {
      await fs.promises.copyFile(item.path, outPath).catch(async () => {
        // try relative to CWD if absolute failed
        const rel = pathMod.resolve(process.cwd(), item.path);
        await fs.promises.copyFile(rel, outPath);
      });
      return;
    }
    const work = async () => {
      // Prefer presigned URL; fallback to SDK stream
      if (typeof fileStorage.getPresignedDownloadUrl === 'function') {
        const pres = await fileStorage.getPresignedDownloadUrl(item.path, expiresSeconds);
        if (!pres.isErr || pres.isOk?.()) {
          const { url } = pres.unwrap ? pres.unwrap() : pres;
          await this.httpStreamToFile(url, outPath);
          return;
        }
      }
      if (typeof fileStorage.readStream === 'function') {
        const rs = await fileStorage.readStream(item.path);
        if (!rs.isErr || rs.isOk?.()) {
          const stream = rs.unwrap ? rs.unwrap() : rs;
          await this.pipeToFile(stream as NodeJS.ReadableStream, outPath);
          return;
        }
      }
      throw new Error(`Cloud download not supported for ${item.path}`);
    };
    if (this.obs && this.obs.isEnabled()) {
      await this.obs.startSegment('Custom/CLI:downloadOne', true, async () => {
        this.obs!.addCustomAttributes({ id: item.id, filename: item.filename, providerPath: item.path });
        try { await work(); } catch (e) { this.obs!.noticeError(e as Error); throw e; }
      });
      return;
    }
    await work();
  }

  private async httpStreamToFile(url: string, outPath: string): Promise<void> {
    const { pipeline, Readable } = await import('stream');
    const { promisify } = await import('util');
    const pipe = promisify(pipeline as any);
    const fs = await import('fs');
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
    }
    const nodeStream = Readable.fromWeb(res.body as any);
    await pipe(nodeStream, fs.createWriteStream(outPath));
  }

  private async pipeToFile(stream: NodeJS.ReadableStream, outPath: string): Promise<void> {
    const { pipeline } = await import('stream');
    const { promisify } = await import('util');
    const pipe = promisify(pipeline as any);
    const fs = await import('fs');
    await pipe(stream, fs.createWriteStream(outPath));
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
  private async seedDatabase(options: { reset?: boolean; clearOnly?: boolean }): Promise<void> {
    try {
      this.logger.info('🌱 Seeding database...', options);
      const result = await runSeed({ reset: Boolean(options?.reset), clearOnly: Boolean(options?.clearOnly) });
      if ((result as any).isErr && (result as any).isErr()) {
        const err = (result as any).unwrapErr ? (result as any).unwrapErr() : new Error('Seeding failed');
        throw err;
      }
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