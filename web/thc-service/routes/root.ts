import { type FastifyInstance, type FastifyPluginOptions } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    example: string;
  }
}

export default async function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  fastify.get('/example', async (_request, _reply) => {
    return { hello: fastify.example };
  });
}
