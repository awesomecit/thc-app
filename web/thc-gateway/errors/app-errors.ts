/**
 * Custom Error Classes
 *
 * Base AppError class and specific error types for consistent error handling.
 *
 * Key features:
 * - `expose` flag: controls whether original message goes to client (false for 5xx)
 * - `statusCode`: HTTP status code
 * - `code`: Machine-readable error code (for metrics and filtering)
 */

import { ERROR_CODES, type ErrorCode } from './error-codes.js';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly expose = true // If true, original message sent to client
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Generic client error
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, ERROR_CODES.BAD_REQUEST, message, true);
  }
}

/**
 * 400 Validation Error - Input validation failed
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly details?: string[]
  ) {
    super(400, ERROR_CODES.VALIDATION_ERROR, message, true);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, ERROR_CODES.UNAUTHORIZED, message, true);
  }
}

/**
 * 403 Forbidden - Authenticated but insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, ERROR_CODES.FORBIDDEN, message, true);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, ERROR_CODES.NOT_FOUND, message, true);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, ERROR_CODES.CONFLICT, message, true);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, ERROR_CODES.TOO_MANY_REQUESTS, message, true);
  }
}

/**
 * 500 Database Error - Database operation failed
 *
 * IMPORTANT: expose=false ensures connection strings and internal details
 * are NOT sent to client. Original error logged server-side only.
 */
export class DatabaseError extends AppError {
  constructor(public readonly originalError: Error) {
    super(500, ERROR_CODES.DATABASE_ERROR, originalError.message, false);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 *
 * IMPORTANT: expose=false ensures sensitive data (API keys, paths, etc.)
 * is NOT sent to client. Original error logged server-side only.
 */
export class InternalServerError extends AppError {
  constructor(public readonly originalError?: Error) {
    const message = originalError?.message ?? 'Internal server error';
    super(500, ERROR_CODES.INTERNAL_ERROR, message, false);
  }
}

/**
 * 503 Service Unavailable - External dependency unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(503, ERROR_CODES.SERVICE_UNAVAILABLE, message, false);
  }
}

/**
 * 504 Gateway Timeout - Upstream service timeout
 */
export class GatewayTimeoutError extends AppError {
  constructor(message = 'Gateway timeout') {
    super(504, ERROR_CODES.GATEWAY_TIMEOUT, message, false);
  }
}
