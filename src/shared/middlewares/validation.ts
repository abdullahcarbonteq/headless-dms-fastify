import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ResponseHandler } from '../utils/ResponseHandler.js';

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Centralized validation middleware using Railway pattern
 */
export function validateRequest(config: ValidationConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate body
      if (config.body) {
        const bodyResult = config.body.safeParse(request.body);
        if (!bodyResult.success) {
          return ResponseHandler.error(
            reply,
            new Error(`Invalid request body: ${bodyResult.error.message}`),
            400
          );
        }
        request.body = bodyResult.data;
      }

      // Validate query
      if (config.query) {
        const queryResult = config.query.safeParse(request.query);
        if (!queryResult.success) {
          return ResponseHandler.error(
            reply,
            new Error(`Invalid query parameters: ${queryResult.error.message}`),
            400
          );
        }
        request.query = queryResult.data;
      }

      // Validate params
      if (config.params) {
        const paramsResult = config.params.safeParse(request.params);
        if (!paramsResult.success) {
          return ResponseHandler.error(
            reply,
            new Error(`Invalid path parameters: ${paramsResult.error.message}`),
            400
          );
        }
        request.params = paramsResult.data;
      }
    } catch (error) {
      return ResponseHandler.error(
        reply,
        error instanceof Error ? error : new Error('Validation failed'),
        400
      );
    }
  };
}

/**
 * Helper function to create validation middleware for common patterns
 */
export const ValidationMiddleware = {

  body: (schema: ZodSchema) => validateRequest({ body: schema }),
  query: (schema: ZodSchema) => validateRequest({ query: schema }),
  params: (schema: ZodSchema) => validateRequest({ params: schema }),
  all: (config: ValidationConfig) => validateRequest(config)
}; 