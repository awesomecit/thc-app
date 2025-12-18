/**
 * Standard Error Codes
 *
 * Machine-readable error codes for:
 * - Client error handling
 * - Prometheus metrics aggregation (http_errors_total{code="NOT_FOUND"})
 * - Log filtering and analysis
 *
 * Naming convention: UPPER_SNAKE_CASE with descriptive names
 */

export const ERROR_CODES = {
  // 4xx Client Errors (details can be exposed to client)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // 5xx Server Errors (details MUST be masked)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
