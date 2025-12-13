/// <reference types="@platformatic/gateway" />
import { FastifyInstance } from 'fastify';

const healthSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
      },
    },
  },
};

export default function healthPlugin(app: FastifyInstance): void {
  app.get(
    '/health/ready',
    {
      schema: {
        ...healthSchema,
        description: 'Readiness probe - checks if gateway can receive traffic',
        tags: ['health'],
        summary: 'Health check - Ready',
      },
    },
    () => {
      return { status: 'ok' };
    }
  );

  app.get(
    '/health/live',
    {
      schema: {
        ...healthSchema,
        description: 'Liveness probe - checks if gateway is alive',
        tags: ['health'],
        summary: 'Health check - Live',
      },
    },
    () => {
      return { status: 'ok' };
    }
  );
}
