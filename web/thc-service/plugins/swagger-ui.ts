/// <reference types="@platformatic/service" />
import type { FastifyInstance } from 'fastify';
import fastifySwaggerUi from '@fastify/swagger-ui';

export default async function swaggerUiPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwaggerUi, {
    routePrefix: '/swagger',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}
