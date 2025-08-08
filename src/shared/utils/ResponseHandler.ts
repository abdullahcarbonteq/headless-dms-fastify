import { FastifyReply } from 'fastify';
import { Result } from '@carbonteq/fp';

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationInfo;
}

export class ResponseHandler {
  /**
   * Handle Railway Result pattern for successful responses
   */
  static success<T>(
    reply: FastifyReply,
    result: Result<T, Error>,
    statusCode: number = 200,
    message?: string
  ): FastifyReply {
    if (result.isErr()) {
      return this.error(reply, result.unwrapErr(), 500);
    }

    const data = result.unwrap();
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return reply.status(statusCode).send(response);
  }

  /**
   * Handle Railway Result pattern for error responses
   */
  static error(
    reply: FastifyReply,
    error: Error,
    statusCode: number = 500
  ): FastifyReply {
    const response: ApiResponse<never> = {
      success: false,
      error: error.message
    };

    return reply.status(statusCode).send(response);
  }

  /**
   * Handle Railway Result pattern for optional data (404 handling)
   */
  static optional<T>(
    reply: FastifyReply,
    result: Result<T | null, Error>,
    notFoundMessage: string = 'Resource not found'
  ): FastifyReply {
    if (result.isErr()) {
      return this.error(reply, result.unwrapErr(), 500);
    }

    const data = result.unwrap();
    if (!data) {
      return this.error(reply, new Error(notFoundMessage), 404);
    }

    return this.success(reply, Result.Ok(data), 200);
  }

  /**
   * Handle Railway Result pattern for boolean operations (delete, update)
   */
  static boolean(
    reply: FastifyReply,
    result: Result<boolean, Error>,
    successMessage: string = 'Operation completed successfully',
    notFoundMessage: string = 'Resource not found'
  ): FastifyReply {
    if (result.isErr()) {
      return this.error(reply, result.unwrapErr(), 500);
    }

    const success = result.unwrap();
    if (!success) {
      return this.error(reply, new Error(notFoundMessage), 404);
    }

    return this.success(reply, Result.Ok(success), 200, successMessage);
  }

  /**
   * Handle Railway Result pattern for paginated responses
   */
  static paginated<T>(
    reply: FastifyReply,
    result: Result<T[] | { data: T[]; page: number; limit: number; total: number; totalPages: number }, Error>
  ): FastifyReply {
    if (result.isErr()) {
      return this.error(reply, result.unwrapErr(), 500);
    }

    const data = result.unwrap();
    
    // Always return a paginated shape for list endpoints
    if (Array.isArray(data)) {
      const page = 1;
      const limit = data.length;
      const total = data.length;
      const totalPages = 1;

      const pagination: PaginationInfo = {
        page,
        limit,
        total,
        totalPages,
        hasNext: false,
        hasPrev: false,
      };

      const response: ApiResponse<T[]> = {
        success: true,
        data,
        pagination,
      };

      return reply.status(200).send(response);
    }

    const pagination: PaginationInfo = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
      hasNext: data.page < data.totalPages,
      hasPrev: data.page > 1,
    };

    const response: ApiResponse<T[]> = {
      success: true,
      data: data.data,
      pagination,
    };

    return reply.status(200).send(response);
  }

  /**
   * Handle Railway Result pattern for file upload responses
   */
  static upload<T>(
    reply: FastifyReply,
    result: Result<T, Error>
  ): FastifyReply {
    if (result.isErr()) {
      return this.error(reply, result.unwrapErr(), 400);
    }

    const data = result.unwrap();
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: 'File uploaded successfully'
    };

    return reply.status(201).send(response);
  }
} 