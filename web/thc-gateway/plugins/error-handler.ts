/**
 * Error Handler Plugin
 *
 * Centralized error handling for all routes with:
 * - Standard error format with requestId for correlation
 * - Automatic message sanitization for 5xx errors (no sensitive data exposure)
 * - @fastify/sensible integration for HTTP helpers
 * - Error code for metrics aggregation
 * - Full error logging server-side with stack trace
 *
 * BDD Scenarios:
 * - Validation errors (400) return details array
 * - Not found errors (404) return NOT_FOUND code
 * - Internal errors (500) do NOT include stack trace in response
 * - Custom business errors use statusCode property
 * - Sensitive data (connection strings, paths) not exposed to client
 * - All errors logged with ERROR/WARN level including requestId
 * - Error responses include requestId for correlation
 */

/// <reference types="@platformatic/gateway" />
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Standard Error Codes
 * Machine-readable for client handling, metrics aggregation, log filtering
 */
const ERROR_CODES = {
  // 4xx Client Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Base application error with statusCode, code, and expose flag
 */
class AppError extends Error {
  statusCode: number;
  code: ErrorCode;
  expose: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.expose = expose;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ValidationError class removed - using duck typing instead of instanceof check

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  // Register @fastify/sensible for HTTP helpers (reply.notFound(), reply.badRequest(), etc.)
  await app.register(import('@fastify/sensible'));

  app.log.info('🔌 Error handler plugin loaded');

  // Error handler requires comprehensive logic for different error types (Fastify validation, custom AppError, generic errors)
  // Each type needs specific handling for proper status codes, message sanitization, and logging
  app.setErrorHandler(
    // eslint-disable-next-line sonarjs/cognitive-complexity, complexity
    async (error: FastifyError | AppError, request: FastifyRequest, reply: FastifyReply) => {
      const requestId = request.id;
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500;

      // Determine if message should be exposed to client
      // Rule: 5xx = ALWAYS masked, 4xx = controlled by AppError.expose flag
      const shouldExpose = statusCode < 500 && (error instanceof AppError ? error.expose : true);

      // Determine error code for metrics and response
      const errorCode =
        (error as AppError).code ||
        (statusCode === 404 ? ERROR_CODES.NOT_FOUND : ERROR_CODES.INTERNAL_ERROR);

      // Log complete error server-side (ALWAYS with stack trace)
      const logLevel = statusCode >= 500 ? 'error' : 'warn';
      const logData: Record<string, unknown> = {
        error: error.message,
        stack: error.stack,
        code: errorCode,
        statusCode,
        requestId,
        url: request.url,
        method: request.method,
      };

      // Add original error details if available (e.g., DatabaseError wrapping original error)
      if (error instanceof AppError && 'originalError' in error && error.originalError) {
        const origErr = error.originalError as Error;
        logData.originalError = origErr.message;
        logData.originalStack = origErr.stack;
      }

      request.log[logLevel](logData, `Request error: ${error.message}`);

      // Error metrics are tracked by the metrics plugin via onResponse hook

      // Handle custom AppError (duck typing to avoid instanceof issues with duplicated classes)
      if ('statusCode' in error && 'code' in error && typeof error.code === 'string') {
        const appError = error as AppError;
        const errorDetails = (error as { details?: unknown[] }).details;
        return reply.status(appError.statusCode).send({
          error: {
            code: appError.code,
            message: shouldExpose ? error.message : getGenericMessage(appError.statusCode),
            ...(Array.isArray(errorDetails) ? { details: errorDetails } : {}),
            requestId,
          },
        });
      }

      // Handle Fastify validation errors (JSON Schema failures)
      if (error.validation) {
        return reply.status(400).send({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid input',
            details: error.validation.map((v) => `${v.instancePath || 'body'}: ${v.message}`),
            requestId,
          },
        });
      }

      // Handle @fastify/sensible errors (e.g., reply.notFound())
      if (statusCode === 404) {
        return reply.status(404).send({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Resource not found',
            requestId,
          },
        });
      }

      // Generic errors (including 5xx) - ALWAYS sanitized
      return reply.status(statusCode).send({
        error: {
          code: errorCode,
          message: getGenericMessage(statusCode),
          requestId,
        },
      });
    }
  );
};

/**
 * Get generic message based on status code
 * Used for sanitizing error messages when expose=false
 */
function getGenericMessage(statusCode: number): string {
  if (statusCode >= 500) {
    return 'Internal server error';
  }
  if (statusCode === 404) {
    return 'Resource not found';
  }
  if (statusCode === 401) {
    return 'Unauthorized';
  }
  if (statusCode === 403) {
    return 'Forbidden';
  }
  if (statusCode === 429) {
    return 'Too many requests';
  }
  return 'Bad request';
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler-plugin',
  fastify: '5.x',
  dependencies: ['request-id-plugin'], // Must load AFTER request-id to access request.id
});
