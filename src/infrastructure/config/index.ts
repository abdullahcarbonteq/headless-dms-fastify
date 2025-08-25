import { configSchema, type Config } from './schemas.js';

/**
 * Load and validate configuration from environment variables
 * This function will throw an error if required configuration is missing or invalid
 */
function loadConfig(): Config {
  const rawConfig = {
    database: {
      url: process.env.DATABASE_URL,
      pool: {
        max: process.env.PGPOOL_MAX,
        min: process.env.PGPOOL_MIN,
        idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT_MS,
      },
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
    server: {
      port: process.env.PORT,
      host: process.env.HOST,
    },
    app: {
      environment: process.env.NODE_ENV,
      cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: process.env.CORS_CREDENTIALS === 'true',
      },
      logging: {
        level: process.env.LOG_LEVEL,
        format: process.env.LOG_FORMAT,
        enableConsole: process.env.LOG_ENABLE_CONSOLE === 'true',
        enableFile: process.env.LOG_ENABLE_FILE === 'true',
        filePath: process.env.LOG_FILE_PATH,
      },
      upload: {
        // Align names with types/fastify.d.ts declarations
        maxFileSize: process.env.MAX_FILE_SIZE ?? process.env.UPLOAD_MAX_FILE_SIZE,
        allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES 
          ? process.env.UPLOAD_ALLOWED_MIME_TYPES.split(',').map(type => type.trim())
          : undefined,
        uploadDir: process.env.UPLOAD_DIR,
        maxFiles: process.env.MAX_FILES ?? process.env.UPLOAD_MAX_FILES,
      },
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER,
      timeoutMs: {
        save: process.env.STORAGE_TIMEOUT_SAVE_MS,
        remove: process.env.STORAGE_TIMEOUT_REMOVE_MS,
      },
      strategy: process.env.MULTI_STORAGE_RULES ? JSON.parse(process.env.MULTI_STORAGE_RULES) : undefined,
    },
  };

  // Validate configuration
  const result = configSchema.safeParse(rawConfig);
  
  if (!result.success) {
    console.error('❌ Configuration validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid configuration. Please check your environment variables.');
  }

  console.log('✅ Configuration loaded successfully');
  return result.data;
}

// Export the validated configuration
export const config = loadConfig();

// Export individual config sections for convenience
export const { database, jwt, server, app } = config; 