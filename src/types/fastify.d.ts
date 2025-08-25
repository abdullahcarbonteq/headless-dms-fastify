/**
 * Fastify Type Extensions
 * 
 * Extends Fastify's built-in types to include our custom properties
 * This eliminates the need for type assertions like (request as any)
 */

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Unique request ID for tracing and debugging
     */
    id: string;
    
    /**
     * Request start timestamp for performance monitoring
     */
    startTime: number;
    
    /**
     * Request correlation ID for distributed tracing
     */
    correlationId?: string;
    
    /**
     * User agent information
     */
    userAgent?: string;
    
    /**
     * Client IP address (handles proxy headers)
     */
    clientIp?: string;
  }

  interface FastifyReply {
    /**
     * Request duration in milliseconds
     */
    requestDuration?: number;
    
    /**
     * Response size in bytes
     */
    responseSize?: number;
  }
}

/**
 * Global type declarations for request context
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      HOST?: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN?: string;
      LOG_LEVEL?: string;
      UPLOAD_DIR?: string;
      MAX_FILE_SIZE?: string;
      MAX_FILES?: string;
      CORS_ORIGIN?: string;
      CORS_CREDENTIALS?: string;
      PGPOOL_MAX?: string;
      PGPOOL_MIN?: string;
      PG_IDLE_TIMEOUT_MS?: string;
      PG_CONN_TIMEOUT_MS?: string;
      STORAGE_PROVIDER?: 'fs' | 's3' | 'gcs' | 'azure' | 'multi';
      STORAGE_TIMEOUT_SAVE_MS?: string;
      STORAGE_TIMEOUT_REMOVE_MS?: string;
      MULTI_STORAGE_RULES?: string; // JSON
      // Provider-specific envs (examples)
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      AWS_REGION?: string;
      S3_BUCKET?: string;
      S3_PREFIX?: string;
      GOOGLE_APPLICATION_CREDENTIALS?: string;
      GCS_BUCKET?: string;
      GCS_PREFIX?: string;
      STORAGE_EMULATOR_HOST?: string;
      GCS_EMULATOR_HOST?: string;
      GCP_PROJECT?: string;
      GOOGLE_CLOUD_PROJECT?: string;
      AZURE_STORAGE_CONNECTION_STRING?: string;
      AZURE_CONTAINER?: string;
      AZURE_PREFIX?: string;
    }
  }
}

export {}; 