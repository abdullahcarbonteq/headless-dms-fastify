import { DatabaseConfig, JWTConfig, ServerConfig, AppConfig } from '../../infrastructure/config/schemas.js';


export interface IConfigurationService {
  get app(): AppConfig; //get application configuration
  get database(): DatabaseConfig;
  get jwt(): JWTConfig;
  get server(): ServerConfig;
  validate(): void; //validate configuration at run time
  getAll(): any;
} 