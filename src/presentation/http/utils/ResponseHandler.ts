import { FastifyReply } from 'fastify';
import { Paginated as HexPaginated, AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';

export interface PaginationInfo {
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: unknown;
  pagination?: PaginationInfo;
}

export class ResponseHandler {
  /**
   * Map AppErrStatus to HTTP status codes
   */
  private static mapAppErrorStatusToHttpStatus(status: AppErrStatus): number {
    switch (status) {
      case AppErrStatus.NotFound:
        return 404;
      case AppErrStatus.Unauthorized:
        return 401;
      case AppErrStatus.InvalidData:
        return 400;
      case AppErrStatus.InvalidOperation:
        return 400;
      case AppErrStatus.AlreadyExists:
        return 409;
      case AppErrStatus.GuardViolation:
        return 403;
      case AppErrStatus.Generic:
      default:
        return 500;
    }
  }

  /**
   * Handle AppResult pattern for successful responses
   */
  static success<T>(
    reply: FastifyReply,
    result: AppResult<T>,
    statusCode: number = 200,
    message?: string
  ): FastifyReply {
    if (result.isErr()) {
      const error = result.unwrapErr();
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      return this.error(reply, error, httpStatus);
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
   * Handle AppResult pattern for error responses
   */
  static error(
    reply: FastifyReply,
    error: Error | AppError,
    statusCode: number = 500,
    details?: unknown
  ): FastifyReply {
    // Handle AppError specially
    if (error instanceof AppError) {
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      const response: ApiResponse<never> = {
        success: false,
        error: error.message,
        ...(details ? { errors: details } : {})
      };
      return reply.status(httpStatus).send(response);
    }

    // Handle regular Error
    const response: ApiResponse<never> = {
      success: false,
      error: error?.message || 'Unknown error occurred',
      ...(details ? { errors: details } : {})
    };

    return reply.status(statusCode).send(response);
  }

  /**
   * Handle AppResult pattern for optional data (404 handling)
   */
  static optional<T>(
    reply: FastifyReply,
    result: AppResult<T | null>,
    notFoundMessage: string = 'Resource not found'
  ): FastifyReply {
    if (result.isErr()) {
      const error = result.unwrapErr();
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      return this.error(reply, error, httpStatus);
    }

    const data = result.unwrap();
    if (!data) {
      return this.error(reply, AppError.NotFound(notFoundMessage), 404);
    }

    return this.success(reply, AppResult.Ok(data), 200);
  }

  /**
   * Handle AppResult pattern for boolean operations (delete, update)
   */
  static boolean(
    reply: FastifyReply,
    result: AppResult<boolean>,
    successMessage: string = 'Operation completed successfully',
    notFoundMessage: string = 'Resource not found'
  ): FastifyReply {
    if (result.isErr()) {
      const error = result.unwrapErr();
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      return this.error(reply, error, httpStatus);
    }

    const success = result.unwrap();
    if (!success) {
      return this.error(reply, AppError.NotFound(notFoundMessage), 404);
    }

    return this.success(reply, AppResult.Ok(success), 200, successMessage);
  }

  /**
   * Handle AppResult pattern for paginated responses
   */
  static paginated<T>(
    reply: FastifyReply,
    result: AppResult<HexPaginated<T>>
  ): FastifyReply {
    if (result.isErr()) {
      const error = result.unwrapErr();
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      return this.error(reply, error, httpStatus);
    }

    const data = result.unwrap();
    const pagination: PaginationInfo = {
      pageNum: data.pageNum,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
    };

    const response: ApiResponse<T[]> = {
      success: true,
      data: data.data,
      pagination,
    };

    return reply.status(200).send(response);
  }

  /**
   * Handle AppResult pattern for file upload responses
   */
  static upload<T>(
    reply: FastifyReply,
    result: AppResult<T>
  ): FastifyReply {
    if (result.isErr()) {
      const error = result.unwrapErr();
      const httpStatus = this.mapAppErrorStatusToHttpStatus(error.status);
      return this.error(reply, error, httpStatus);
    }

    const data = result.unwrap();
    const response: ApiResponse<T> = {
      success: true,
      data,
    };

    return reply.status(201).send(response);
  }
} 