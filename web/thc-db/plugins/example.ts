import { type FastifyInstance, type FastifyPluginOptions } from 'fastify';

export default async function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  fastify.decorate('example', 'foobar');
}
