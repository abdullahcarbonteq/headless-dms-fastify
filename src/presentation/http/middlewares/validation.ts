import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';
import { ResponseHandler } from '../utils/ResponseHandler.js';
import { safeParseResult, handleZodErr, AppError, AppErrStatus } from '@carbonteq/hexapp';

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Safe wrapper for hexapp validation that handles the zod-validation-error crash
 */
function safeHexappValidation<T>(schema: ZodSchema, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    // Try hexapp's safeParseResult first
    const result = safeParseResult(schema as any, data, handleZodErr);
    if (result.isErr()) {
      // If hexapp succeeds but validation fails, extract the error message
      const error = result.unwrapErr();
      // Try to extract field name from error message or use generic message
      const errorMessage = error.message || 'Validation failed';
      return { success: false, error: errorMessage };
    }
    return { success: true, data: result.unwrap() as T };
  } catch (hexappError) {
    // If hexapp crashes (due to zod-validation-error bug), fall back to direct Zod validation
    console.log('Hexapp validation crashed, falling back to direct Zod validation');
    try {
      const directResult = schema.safeParse(data);
      if (directResult.success) {
        return { success: true, data: directResult.data as T };
      } else {
        // Format Zod error manually since hexapp crashed
        // Extract field names and error messages for better error reporting
        console.log('Raw Zod error object:', JSON.stringify(directResult.error, null, 2));
        
        // Cast to any to access the properties safely
        const zodError = directResult.error as any;
        
        // In Zod v4, the error details are in the message property as a JSON string
        let errorDetails = 'Validation failed';
        
        try {
          if (zodError.message) {
            // Try to parse the message as JSON (it contains the error array)
            const parsedErrors = JSON.parse(zodError.message);
            if (Array.isArray(parsedErrors)) {
              errorDetails = parsedErrors.map((err: any) => {
                const field = err.path?.join('.') || 'unknown';
                const message = err.message || 'Invalid value';
                console.log('Processing parsed error:', { field, message, path: err.path });
                return `${field}: ${message}`;
              }).join(', ');
            }
          }
        } catch (parseError) {
          console.log('Failed to parse Zod error message as JSON:', parseError);
          // Fallback: try to extract field name from the message string
          if (zodError.message && typeof zodError.message === 'string') {
            // Look for common patterns in the message
            if (zodError.message.includes('email')) {
              errorDetails = 'email: Invalid email address';
            } else if (zodError.message.includes('name')) {
              errorDetails = 'name: Invalid name';
            } else if (zodError.message.includes('role')) {
              errorDetails = 'role: Invalid role';
            } else if (zodError.message.includes('password')) {
              errorDetails = 'password: Invalid password';
            }
          }
        }
        
        console.log('Final error details:', errorDetails);
        return { success: false, error: errorDetails };
      }
    } catch (directError) {
      // If even direct validation crashes, return generic error
      console.log('Direct Zod validation also crashed:', directError);
      return { success: false, error: 'Validation failed due to schema error' };
    }
  }
}

/**
 * Centralized validation middleware using Railway pattern with safe hexapp wrapper
 */
export function validateRequest(config: ValidationConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate body
    if (config.body) {
      const bodyResult = safeHexappValidation(config.body, request.body);
      if (!bodyResult.success) {
        return ResponseHandler.error(
          reply, 
          AppError.InvalidData(bodyResult.error), 
          400
        );
      }
      request.body = bodyResult.data;
    }

    // Validate query
    if (config.query) {
      const queryResult = safeHexappValidation(config.query, request.query);
      if (!queryResult.success) {
        return ResponseHandler.error(
          reply, 
          AppError.InvalidData(`Query validation failed: ${queryResult.error}`), 
          400
        );
      }
      request.query = queryResult.data;
    }

    // Validate params
    if (config.params) {
      const paramsResult = safeHexappValidation(config.params, request.params);
      if (!paramsResult.success) {
        return ResponseHandler.error(
          reply, 
          AppError.InvalidData(`Parameter validation failed: ${paramsResult.error}`), 
          400
        );
      }
      request.params = paramsResult.data;
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
  all: (config: ValidationConfig) => validateRequest(config),
}; 