/**
 * JWT Validation Plugin
 *
 * Registers @fastify/jwt with RS256 algorithm and authenticate decorator.
 * Used in gateway mode for token validation without full OIDC flow.
 */

import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPluginOptions {
  keycloakUrl: string;
  realm: string;
  jwtPublicKey?: string;
}

const jwtPlugin: FastifyPluginAsync<JwtPluginOptions> = async (fastify, opts) => {
  // CRITICAL: Validate public key before registering fastify-jwt
  if (!opts.jwtPublicKey) {
    fastify.log.error(
      'JWT plugin requires jwtPublicKey option. Skipping JWT registration - authentication will not work!'
    );
    // Register empty authenticate decorator that always rejects
    fastify.decorate('authenticate', async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.code(503).send({
        error: 'Service Unavailable',
        message: 'JWT validation not configured - missing public key',
      });
    });
    return;
  }

  // Build issuer URL from Keycloak config
  const issuer = `${opts.keycloakUrl}/realms/${opts.realm}`;

  // Register @fastify/jwt in verify-only mode
  await fastify.register(jwt, {
    secret: {
      public: opts.jwtPublicKey,
    },
    verify: {
      algorithms: ['RS256'],
      // Validate issuer matches Keycloak realm URL
      allowedIss: issuer,
      // Require 'sub' claim (subject/user ID)
      requiredClaims: ['sub'],
    },
  });

  // Add authenticate decorator for protected routes
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (_err) {
      fastify.log.debug({ error: _err }, 'JWT verification failed');
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
      });
    }
  });

  fastify.log.info({ issuer }, 'JWT plugin registered');
};

export default fp(jwtPlugin, {
  name: '@thc/auth-jwt',
  fastify: '5.x',
});

export { jwtPlugin };
