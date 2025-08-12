import { injectable } from 'tsyringe';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { config } from './index.js';

/**
 * Configuration service implementation
 * Provides dependency injection for configuration values
 */
@injectable()
export class ConfigurationService implements IConfigurationService {
  private _config = config;

  get app() {
    return this._config.app;
  }

  get database() {
    return this._config.database;
  }

  get jwt() {
    return this._config.jwt;
  }

  get server() {
    return this._config.server;
  }

  validate(): void {
    // Configuration is already validated by Zod schema in config/index.ts
    // This method can be used for additional runtime validation if needed
    if (!this._config.jwt.secret) {
      throw new Error('JWT secret is required');
    }
    
    if (!this._config.database.url) {
      throw new Error('Database URL is required');
    }
  }

  getAll(): any {
    return this._config;
  }
} 