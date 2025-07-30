// src/server.ts
import 'reflect-metadata';
import app from './app.js';
import { config } from './config/index.js';
import { container } from './config/container.js';
import { ILogger } from './shared/interfaces/ILogger.js';

const PORT = config.server.port;

// Initialize DI container and get logger
const logger = container.resolve<ILogger>('ILogger');

app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    logger.info('🚀 Server started successfully', { 
      port: PORT,
      environment: config.app.environment,
      uploadDir: config.app.upload.uploadDir,
      maxFileSize: `${config.app.upload.maxFileSize / (1024 * 1024)}MB`,
      logLevel: config.app.logging.level,
      logFileEnabled: config.app.logging.enableFile
    });
  })
  .catch((err) => {
    logger.error('❌ Failed to start server', err);
    process.exit(1);
  });
