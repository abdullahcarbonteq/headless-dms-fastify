import { ILogger, LogContext } from '../interfaces/ILogger.js';
import { ConsoleLogger } from './ConsoleLogger.js';
import { FileLogger } from './FileLogger.js';
import { config } from '../../config/index.js';

export class CompositeLogger implements ILogger {
  private consoleLogger: ConsoleLogger;
  private fileLogger: FileLogger;

  constructor(baseContext: LogContext = {}) {
    this.consoleLogger = new ConsoleLogger(baseContext);
    this.fileLogger = new FileLogger(baseContext);
  }

  debug(message: string, context?: LogContext): void {
    this.consoleLogger.debug(message, context);
    if (config.app.logging.enableFile) {
      this.fileLogger.debug(message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.consoleLogger.info(message, context);
    if (config.app.logging.enableFile) {
      this.fileLogger.info(message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    this.consoleLogger.warn(message, context);
    if (config.app.logging.enableFile) {
      this.fileLogger.warn(message, context);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.consoleLogger.error(message, error, context);
    if (config.app.logging.enableFile) {
      this.fileLogger.error(message, error, context);
    }
  }

  child(context: LogContext): ILogger {
    return new CompositeLogger(context);
  }
} 