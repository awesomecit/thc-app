/**
 * Test Error Routes (Development Only)
 *
 * Routes to trigger different error types for manual testing and verification.
 *
 * IMPORTANT: These routes are only registered in non-production environments.
 *
 * Usage:
 *   curl http://localhost:3042/test-errors/validation
 *   curl http://localhost:3042/test-errors/not-found
 *   curl http://localhost:3042/test-errors/database
 *   curl http://localhost:3042/test-errors/generic
 *   curl http://localhost:3042/test-errors/sensible-404
 */

/// <reference types="@platformatic/gateway" />
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

// Error classes duplicated here to avoid external imports (Node.js ESM resolution issue)
// Refactoring to shared module blocked by Platformatic ESM plugin loading from source
class AppError extends Error {
  statusCode: number;
  code: string;
  expose: boolean;

  constructor(statusCode: number, code: string, message: string, expose = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.expose = expose;
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  details?: string[];
  constructor(message: string, details?: string[]) {
    super(400, 'VALIDATION_ERROR', message, true);
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message, true);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message, true);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message, true);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, 'CONFLICT', message, true);
  }
}

class DatabaseError extends AppError {
  originalError: Error;
  constructor(originalError: Error) {
    super(500, 'DATABASE_ERROR', originalError.message, false);
    this.originalError = originalError;
  }
}

class InternalServerError extends AppError {
  originalError?: Error;
  constructor(originalError?: Error) {
    const message = originalError?.message ?? 'Internal server error';
    super(500, 'INTERNAL_ERROR', message, false);
    this.originalError = originalError;
  }
}

async function testErrorRoutesPlugin(app: FastifyInstance): Promise<void> {
  // Skip registration in production
  if (process.env.NODE_ENV === 'production') {
    app.log.info('⏭️  Test error routes skipped (production mode)');
    return;
  }

  app.log.info('🧪 Test error routes registered (development mode)');

  // 400 - Validation error with details
  app.get('/test-errors/validation', async () => {
    throw new ValidationError('Invalid input data', [
      'email: must be a valid email address',
      'age: must be greater than 0',
    ]);
  });

  // 401 - Unauthorized
  app.get('/test-errors/unauthorized', async () => {
    throw new UnauthorizedError('Authentication token missing or invalid');
  });

  // 403 - Forbidden
  app.get('/test-errors/forbidden', async () => {
    throw new ForbiddenError('You do not have permission to access this resource');
  });

  // 404 - Not found (custom error)
  app.get('/test-errors/not-found', async () => {
    throw new NotFoundError('User with ID 123 not found');
  });

  // 409 - Conflict
  app.get('/test-errors/conflict', async () => {
    throw new ConflictError('Email already exists');
  });

  // 500 - Database error (should mask connection string)
  app.get('/test-errors/database', async () => {
    // Simulate database error with sensitive connection string
    // secretlint-disable-next-line
    const dbError = new Error(
      'Connection failed: postgres://admin:password123@db.internal:5432/prod_db'
    );
    throw new DatabaseError(dbError);
  });

  // 500 - Generic internal error (should mask sensitive data)
  app.get('/test-errors/generic', async () => {
    // Simulate error with sensitive data (API key, file path)
    throw new Error(
      'Failed to call external API with key: sk_live_abc123xyz456 at /var/secrets/api.key'
    );
  });

  // 500 - Internal server error (wrapped)
  app.get('/test-errors/internal', async () => {
    const originalError = new Error('Unexpected error in payment processor');
    throw new InternalServerError(originalError);
  });

  // 404 - Using @fastify/sensible helper
  app.get('/test-errors/sensible-404', async (request, reply) => {
    reply.notFound('This resource does not exist');
  });

  // 400 - Using @fastify/sensible helper
  app.get('/test-errors/sensible-400', async (request, reply) => {
    reply.badRequest('Invalid request parameters');
  });

  // Summary endpoint
  app.get('/test-errors', async () => {
    return {
      message: 'Test error routes (development only)',
      endpoints: [
        'GET /test-errors/validation (400)',
        'GET /test-errors/unauthorized (401)',
        'GET /test-errors/forbidden (403)',
        'GET /test-errors/not-found (404)',
        'GET /test-errors/conflict (409)',
        'GET /test-errors/database (500 - masked)',
        'GET /test-errors/generic (500 - masked)',
        'GET /test-errors/internal (500 - masked)',
        'GET /test-errors/sensible-404 (404)',
        'GET /test-errors/sensible-400 (400)',
      ],
    };
  });
}

export default fp(testErrorRoutesPlugin, {
  name: 'test-errors-routes',
});
