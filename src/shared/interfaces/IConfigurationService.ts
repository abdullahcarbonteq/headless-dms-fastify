
export interface DatabaseConfig {
  url: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface ServerConfig {
  port: number;
  host: string;
}

export interface AppConfig {
  environment: 'development' | 'production' | 'test';
  cors: { origin: string; credentials: boolean };
  logging: { level: 'debug' | 'info' | 'warn' | 'error'; format: 'json' | 'text'; enableConsole: boolean; enableFile: boolean; filePath?: string };
  upload: { maxFileSize: number; allowedMimeTypes?: string[]; uploadDir: string; maxFiles: number };
}

export type StorageProvider = 'fs' | 's3' | 'gcs' | 'azure' | 'multi';

export interface StorageConfig {
  provider: StorageProvider;
  timeoutMs: { save: number; remove: number };
  strategy?: { rules?: unknown; fallback?: StorageProvider[] };
}


export interface IConfigurationService {
  get app(): AppConfig; //get application configuration
  get database(): DatabaseConfig;
  get jwt(): JWTConfig;
  get server(): ServerConfig;
  get storage(): StorageConfig;
  validate(): void; //validate configuration at run time
  getAll(): { app: AppConfig; database: DatabaseConfig; jwt: JWTConfig; server: ServerConfig; storage: StorageConfig };
} 