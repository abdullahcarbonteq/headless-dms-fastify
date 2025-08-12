import { DatabaseConfig, JWTConfig, ServerConfig, AppConfig } from '../../infrastructure/config/schemas.js';

/**
 * Configuration service interface for type-safe configuration access
 * Provides dependency injection for configuration values
 */
export interface IConfigurationService {
  /**
   * Get application configuration
   */
  get app(): AppConfig;

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig;

  /**
   * Get JWT configuration
   */
  get jwt(): JWTConfig;

  /**
   * Get server configuration
   */
  get server(): ServerConfig;

  /**
   * Validate configuration at runtime
   */
  validate(): void;

  /**
   * Get all configuration as a single object
   */
  getAll(): any;
} 