/// <reference types="@platformatic/db" />
import type { FastifyInstance } from 'fastify';

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

export default async function healthPlugin(app: FastifyInstance): Promise<void> {
  app.get(
    '/health/ready',
    {
      schema: {
        ...healthSchema,
        description: 'Readiness probe - checks database connection',
        tags: ['health'],
        summary: 'Health check - Ready',
      },
    },
    async () => {
      // Verifica connessione DB
      try {
        await app.platformatic.entities.movie.count();
        return { status: 'ok' };
      } catch (error) {
        app.log.error({ error }, 'Health check failed');
        throw error;
      }
    }
  );

  app.get(
    '/health/live',
    {
      schema: {
        ...healthSchema,
        description: 'Liveness probe - checks if database service is alive',
        tags: ['health'],
        summary: 'Health check - Live',
      },
    },
    () => {
      return { status: 'ok' };
    }
  );
}
