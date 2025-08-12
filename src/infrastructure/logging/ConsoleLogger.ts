import { ILogger, LogContext, LogLevel } from '../../shared/interfaces/ILogger.js';
import { config } from '../config/index.js';

export class ConsoleLogger implements ILogger {
  private baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const errorStr = error ? `\n❌ Error: ${error.message}` : '';
    
    
    return `[${timestamp}] ${level.toUpperCase()} | ${message}${contextStr}${errorStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevel = config.app.logging.level as LogLevel;
    return levels.indexOf(level) >= levels.indexOf(currentLevel);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const mergedContext = { ...this.baseContext, ...context };
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, mergedContext);
    console.log(`🐛 ${formattedMessage}`);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const mergedContext = { ...this.baseContext, ...context };
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, mergedContext);
    console.log(`ℹ️  ${formattedMessage}`);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const mergedContext = { ...this.baseContext, ...context };
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, mergedContext);
    console.warn(`⚠️  ${formattedMessage}`);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const mergedContext = { ...this.baseContext, ...context };
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, mergedContext, error);
    console.error(`❌ ${formattedMessage}`);
    
    if (error?.stack) {
      console.error(`📚 Stack trace: ${error.stack}`);
    }
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger({ ...this.baseContext, ...context });
  }
} 