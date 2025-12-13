
import { type FastifyInstance } from 'fastify'
import { PlatformaticApplication, PlatformaticDatabaseConfig, PlatformaticDatabaseMixin, Entities } from '@platformatic/db'

declare module 'fastify' {
  interface FastifyInstance {
    platformatic: PlatformaticApplication<PlatformaticDatabaseConfig> & PlatformaticDatabaseMixin<Entities>
  }
}
