import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

/**
 * Request Context Service
 * 
 * Handles request context, timing, and metadata
 * Provides proper typing and centralized request handling
 */
export class RequestContextService {
  /**
   * Initialize request context
   * Sets up request ID, timing, and metadata
   */
  static initializeRequestContext(request: FastifyRequest): void {
    // Do not override Fastify's own request.id; use it as correlation id fallback
    
    // Set request start time
    request.startTime = Date.now();
    
    // Set correlation ID (for distributed tracing)
    request.correlationId = (request.headers['x-correlation-id'] as string) || request.id;
    
    // Extract user agent
    request.userAgent = request.headers['user-agent'] || 'Unknown';
    
    // Extract client IP (handles proxy headers)
    request.clientIp = this.extractClientIp(request);
  }

  /**
   * Extract client IP address, handling proxy headers
   */
  private static extractClientIp(request: FastifyRequest): string {
    // Check for proxy headers in order of preference
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const cfConnectingIp = request.headers['cf-connecting-ip']; // Cloudflare
    
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
      const forwardedForStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return forwardedForStr.split(',')[0].trim();
    }
    
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }
    
    if (cfConnectingIp) {
      return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
    }
    
    // Fallback to socket address
    return request.socket.remoteAddress || 'unknown';
  }

  /**
   * Finalize request context
   * Calculates duration and logs request completion
   */
  static finalizeRequestContext(request: FastifyRequest, reply: FastifyReply): void {
    // Calculate request duration
    const duration = Date.now() - request.startTime;
    reply.requestDuration = duration;
    
    // Calculate response size (if available)
    const responseSize = this.calculateResponseSize(reply);
    if (responseSize) {
      reply.responseSize = responseSize;
    }
  }

  /**
   * Calculate response size in bytes
   */
  private static calculateResponseSize(reply: FastifyReply): number | undefined {
    try {
      // Fastify doesn't have a getPayload method, so we'll skip response size calculation
      // In a real implementation, you might access the response payload differently
      return undefined;
    } catch (error) {
      // Response might not be JSON or might not have payload
      return undefined;
    }
  }

  /**
   * Get request metadata for logging
   */
  static getRequestMetadata(request: FastifyRequest, reply: FastifyReply): Record<string, any> {
    return {
      requestId: request.id,
      correlationId: request.correlationId,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: reply.requestDuration,
      responseSize: reply.responseSize,
      clientIp: request.clientIp,
      userAgent: request.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create structured log message
   */
  static createLogMessage(request: FastifyRequest, reply: FastifyReply): string {
    const metadata = this.getRequestMetadata(request, reply);
    
    return `${metadata.method} ${metadata.url} - ${metadata.statusCode} - ${metadata.duration}ms - ${metadata.clientIp}`;
  }

  /**
   * Check if request is from a health check endpoint
   */
  static isHealthCheck(request: FastifyRequest): boolean {
    const healthEndpoints = ['/health', '/ready', '/ping'];
    return healthEndpoints.includes(request.url);
  }

  /**
   * Check if request should be logged
   */
  static shouldLogRequest(request: FastifyRequest): boolean {
    // Don't log health checks in production
    if (process.env.NODE_ENV === 'production' && this.isHealthCheck(request)) {
      return false;
    }
    
    return true;
  }
} 