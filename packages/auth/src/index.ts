/**
 * @thc/auth - Keycloak Authentication Plugin
 *
 * Reusable authentication plugin for Platformatic/Fastify services.
 * Provides JWT validation, Keycloak OIDC integration, and session management.
 */

import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyInstance } from 'fastify';
import jwtPlugin from './jwt.js';

/**
 * Authentication plugin options
 */
export interface AuthPluginOptions {
  /** Keycloak base URL (e.g., http://localhost:8080) */
  keycloakUrl: string;
  /** Keycloak realm name */
  realm: string;
  /** Keycloak client ID */
  clientId: string;
  /** Keycloak client secret (for confidential clients) */
  clientSecret?: string;
  /** Redis connection URL (optional) */
  redisUrl?: string;
  /** Redis configuration (alternative to redisUrl) */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  /** Enable /auth/* routes (true for auth-api, false for gateway) */
  enableRoutes?: boolean;
  /** JWT public key for validation (optional, fetched from Keycloak if not provided) */
  jwtPublicKey?: string;
  /** Session TTL in seconds (default: 3600) */
  sessionTTL?: number;
}

/**
 * Parse Redis configuration from multiple sources
 */
function parseRedisConfig(opts: AuthPluginOptions): {
  host: string;
  port: number;
  password?: string;
  db?: number;
} {
  if (opts.redis) {
    return opts.redis;
  }

  if (opts.redisUrl) {
    const url = new URL(opts.redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port !== '' ? url.port : '6379', 10),
      password: url.password !== '' ? url.password : undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  };
}

/**
 * Register Keycloak OIDC plugin with Redis session store
 */
async function registerKeycloakPlugin(
  fastify: FastifyInstance,
  opts: AuthPluginOptions
): Promise<void> {
  fastify.log.info('Auth plugin: enableRoutes is TRUE, registering Keycloak');

  const redisConfig = parseRedisConfig(opts);
  fastify.log.info(
    { redis: { host: redisConfig.host, port: redisConfig.port } },
    'Keycloak plugin: connecting to Redis'
  );

  const keycloakModule = await import('./keycloak.js');
  const keycloakPlugin = keycloakModule.default || keycloakModule;

  await fastify.register(keycloakPlugin, {
    keycloakUrl: opts.keycloakUrl,
    realm: opts.realm,
    clientId: opts.clientId,
    clientSecret: opts.clientSecret ?? '',
    callbackUrl: process.env.KEYCLOAK_CALLBACK_URL ?? 'http://localhost:3042/auth/callback',
    redis: redisConfig,
    sessionTTL: opts.sessionTTL ?? 3600,
  });

  fastify.log.info('Auth plugin: Keycloak OIDC registered');
}

/**
 * Main authentication plugin
 *
 * Registers JWT validation or full Keycloak OIDC depending on enableRoutes option.
 *
 * @example
 * ```typescript
 * // Auth API mode (with routes)
 * await fastify.register(authPlugin, {
 *   keycloakUrl: 'http://localhost:8080',
 *   realm: 'thc',
 *   clientId: 'auth-api',
 *   enableRoutes: true
 * });
 *
 * // Gateway mode (JWT validation only)
 * await fastify.register(authPlugin, {
 *   keycloakUrl: 'http://localhost:8080',
 *   realm: 'thc',
 *   clientId: 'gateway',
 *   enableRoutes: false
 * });
 * ```
 */
const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, opts) => {
  // Validate required options
  if (!opts.keycloakUrl) {
    throw new Error('Missing required option: keycloakUrl');
  }
  if (!opts.realm) {
    throw new Error('Missing required option: realm');
  }
  if (!opts.clientId) {
    throw new Error('Missing required option: clientId');
  }

  fastify.log.info({ enableRoutes: opts.enableRoutes }, 'Auth plugin: checking enableRoutes flag');

  if (opts.enableRoutes) {
    // Full Keycloak OIDC with routes
    await registerKeycloakPlugin(fastify, opts);
  } else {
    // JWT validation only
    await fastify.register(jwtPlugin, opts);
  }

  fastify.log.info(
    {
      realm: opts.realm,
      clientId: opts.clientId,
      enableRoutes: opts.enableRoutes,
    },
    'Auth plugin registered'
  );
};

export default fp(authPlugin, {
  name: '@thc/auth',
  fastify: '5.x',
});

// Re-export sub-plugins for advanced usage
export * from './jwt.js';
export { keycloakPlugin, SessionData } from './keycloak.js';
export type { KeycloakPluginOptions } from './keycloak.js';
export { SessionManager, sessionManagerPlugin } from './session.js';
export type { SessionConfig } from './session.js';
