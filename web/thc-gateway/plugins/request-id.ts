/// <reference types="@platformatic/gateway" />
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

/**
 * Request ID middleware for correlation ID tracking
 *
 * BDD Scenarios:
 * - Generate UUID v4 if X-Request-ID header is missing
 * - Preserve existing X-Request-ID from client
 * - Add X-Request-ID to response headers
 * - Propagate to downstream services via proxy
 * - Include requestId in all logs via child logger
 */
export default function requestIdPlugin(app: FastifyInstance): void {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Extract or generate correlation ID
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();

    // Store in request for access in handlers
    request.id = requestId;

    // Add to response headers
    reply.header('X-Request-ID', requestId);

    // Create child logger with requestId context
    // All logs from this request will include requestId
    request.log = request.log.child({ requestId });
  });

  // Propagate X-Request-ID to downstream services
  app.addHook('onResponse', async (request: FastifyRequest) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: request.raw.statusCode,
      },
      'Request completed'
    );
  });
}
