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
    }
  }
}

export {}; 