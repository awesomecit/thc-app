/// <reference types="@platformatic/gateway" />
import type { FastifyInstance } from 'fastify';

const SERVICE_NAME = 'thc-gateway';

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
  },
};

export default function healthPlugin(app: FastifyInstance): void {
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
        description: 'Liveness probe - checks if gateway is alive',
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
   * Gateway is ready if it can proxy requests (no dependencies to check)
   */
  app.get(
    '/health/ready',
    {
      schema: {
        ...readinessSchema,
        description: 'Readiness probe - checks if gateway can receive traffic',
        tags: ['health'],
        summary: 'Health check - Ready',
      },
    },
    () => {
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: SERVICE_NAME,
        checks: {
          proxy: 'ok',
        },
      };
    }
  );
}
