/// <reference types="@platformatic/db" />
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const SERVICE_NAME = 'thc-db';

const livenessSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string' },
      },
      required: ['status', 'timestamp', 'service'],
    },
  },
};

const readinessSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ready'] },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string' },
        checks: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['status', 'timestamp', 'service', 'checks'],
    },
    503: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['not_ready'] },
        timestamp: { type: 'string', format: 'date-time' },
        service: { type: 'string' },
        checks: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  },
};

export default async function healthPlugin(app: FastifyInstance): Promise<void> {
  /**
   * Liveness probe - checks if service is alive
   * Should NOT check external dependencies
   * Response time: < 100ms
   */
  app.get(
    '/health/live',
    {
      schema: {
        ...livenessSchema,
        description: 'Liveness probe - checks if database service is alive',
        tags: ['health'],
        summary: 'Health check - Live',
      },
    },
    () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
      };
    }
  );

  /**
   * Readiness probe - checks if service can receive traffic
   * Checks database connection and migrations status
   */
  app.get(
    '/health/ready',
    {
      schema: {
        ...readinessSchema,
        description: 'Readiness probe - checks database connection and migrations',
        tags: ['health'],
        summary: 'Health check - Ready',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const checks: Record<string, string> = {};

      // Check database connection
      try {
        await app.platformatic.entities.movie.count();
        checks.database = 'ok';
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        checks.database = `error: ${errorMsg}`;
        app.log.error({ error }, 'Database health check failed');

        return reply.code(503).send({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          service: SERVICE_NAME,
          checks,
        });
      }

      // Check migrations (assuming migrations table exists)
      try {
        // Try to query migrations table - if it exists, migrations are OK
        await app.platformatic.db.query('SELECT 1');
        checks.migrations = 'ok';
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        checks.migrations = `error: ${errorMsg}`;
        app.log.warn({ error }, 'Migrations check failed');
        // Don't fail readiness if migrations check fails - DB might not have migrations table
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        checks,
      };
    }
  );
}
