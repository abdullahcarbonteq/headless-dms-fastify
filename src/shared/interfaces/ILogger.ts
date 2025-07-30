export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  [key: string]: any;
  userId?: string;
  requestId?: string;
  module?: string;
  method?: string;
  duration?: number;
}

export interface ILogger {
  /**
   * Log a debug message
   * @param message - The message to log
   * @param context - Optional context data
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log an info message
   * @param message - The message to log
   * @param context - Optional context data
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log a warning message
   * @param message - The message to log
   * @param context - Optional context data
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log an error message
   * @param message - The message to log
   * @param error - Optional error object
   * @param context - Optional context data
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Create a child logger with additional context
   * @param context - Additional context to include in all log messages
   */
  child(context: LogContext): ILogger;
} 