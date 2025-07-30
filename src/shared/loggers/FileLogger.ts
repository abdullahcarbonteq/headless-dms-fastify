import { ILogger, LogContext, LogLevel } from '../interfaces/ILogger.js';
import { config } from '../../config/index.js';
import fs from 'fs';
import path from 'path';

export class FileLogger implements ILogger {
  private baseContext: LogContext;
  private logFilePath: string;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
    this.logFilePath = config.app.logging.filePath || './logs/app.log';
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: context ? { ...this.baseContext, ...context } : this.baseContext,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
    
    return JSON.stringify(logEntry) + '\n';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevel = config.app.logging.level as LogLevel;
    return levels.indexOf(level) >= levels.indexOf(currentLevel);
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFilePath, message);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
      console.log(message.trim());
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, context);
    this.writeToFile(formattedMessage);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
    this.writeToFile(formattedMessage);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
    this.writeToFile(formattedMessage);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, context, error);
    this.writeToFile(formattedMessage);
  }

  child(context: LogContext): ILogger {
    return new FileLogger({ ...this.baseContext, ...context });
  }
} 