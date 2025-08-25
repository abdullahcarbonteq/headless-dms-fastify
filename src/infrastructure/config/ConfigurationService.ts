import { injectable } from 'tsyringe';
import { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import { config } from './index.js';
import { AppResult, AppError } from '@carbonteq/hexapp';

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

  get storage() {
    return this._config.storage;
  }

  validate(): AppResult<void> {
    // Configuration is already validated by Zod schema in config/index.ts
    // This method can be used for additional runtime validation if needed
    if (!this._config.jwt.secret) {
      return AppResult.Err(AppError.Generic('JWT secret is required'));
    }
    
    if (!this._config.database.url) {
      return AppResult.Err(AppError.Generic('Database URL is required'));
    }

    // Basic guard: storage provider must exist (zod default enforces this)
    if (!this._config.storage?.provider) {
      return AppResult.Err(AppError.Generic('Storage provider is required'));
    }
    return AppResult.Ok(undefined);
  }

  getAll() {
    return this._config;
  }
} 