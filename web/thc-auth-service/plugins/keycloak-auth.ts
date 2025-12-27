/// <reference types="@platformatic/service" />
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Keycloak Authentication Plugin
 *
 * GREEN Phase: Minimal implementation to pass RED tests
 *
 * Provides authentication routes for:
 * - Login (username/password → JWT)
 * - Token validation
 * - Token refresh
 */

const KEYCLOAK_URL = process.env.PLT_KEYCLOAK_URL ?? 'http://localhost:8081';
const KEYCLOAK_REALM = process.env.PLT_KEYCLOAK_REALM ?? 'ticops';
const KEYCLOAK_CLIENT_ID = process.env.PLT_KEYCLOAK_CLIENT_ID ?? 'thc-backend';
const KEYCLOAK_CLIENT_SECRET = process.env.PLT_KEYCLOAK_CLIENT_SECRET ?? '';

const CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

const ERROR_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
} as const;

async function keycloakAuthPlugin(app: FastifyInstance): Promise<void> {
  app.log.info('🔐 Keycloak Auth plugin loaded');

  // POST /auth/login - Authenticate user with Keycloak
  app.post('/auth/login', {
    schema: {
      description: 'Login with username and password via Keycloak',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' },
          },
        },
        401: ERROR_RESPONSE_SCHEMA,
        500: ERROR_RESPONSE_SCHEMA,
      },
    },
    handler: async (request, reply) => {
      const { username, password } = request.body as {
        username: string;
        password: string;
      };

      try {
        const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

        const params = new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_CLIENT_ID,
          username,
          password,
        });

        if (KEYCLOAK_CLIENT_SECRET) {
          params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
        }

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': CONTENT_TYPE_FORM_URLENCODED,
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          app.log.error({ error }, 'Keycloak authentication failed');
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        const tokenData = (await response.json()) as KeycloakTokenResponse;

        return reply.send({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        });
      } catch (error) {
        app.log.error({ error }, 'Error communicating with Keycloak');
        return reply.code(500).send({ error: 'Authentication service error' });
      }
    },
  });

  // POST /auth/validate - Validate JWT token
  app.post('/auth/validate', {
    schema: {
      description: 'Validate JWT token (decode and check expiration)',
      tags: ['auth'],
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: { type: 'string', description: 'Bearer token' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            user: { type: 'object' },
          },
        },
        401: ERROR_RESPONSE_SCHEMA,
        500: ERROR_RESPONSE_SCHEMA,
      },
    },
    handler: async (request, reply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);

      try {
        // Decode JWT without verification (simple base64 decode)
        // In production, you should verify the signature using Keycloak public key
        const parts = token.split('.');

        if (parts.length !== 3) {
          return reply.code(401).send({ error: 'Invalid token format' });
        }

        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as {
          exp?: number;
          preferred_username?: string;
          username?: string;
          email?: string;
          sub?: string;
        };

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return reply.code(401).send({ error: 'Token expired' });
        }

        return reply.send({
          valid: true,
          user: {
            username: payload.preferred_username ?? payload.username,
            email: payload.email,
            sub: payload.sub,
          },
        });
      } catch (error) {
        app.log.error({ error }, 'Error decoding token');
        return reply.code(500).send({ error: 'Token validation error' });
      }
    },
  });

  // POST /auth/refresh - Refresh JWT token
  app.post('/auth/refresh', {
    schema: {
      description: 'Refresh JWT token with refresh token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['refresh_token'],
        properties: {
          refresh_token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'number' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { refresh_token } = request.body as { refresh_token: string };

      try {
        const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: KEYCLOAK_CLIENT_ID,
          refresh_token,
        });

        if (KEYCLOAK_CLIENT_SECRET) {
          params.append('client_secret', KEYCLOAK_CLIENT_SECRET);
        }

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': CONTENT_TYPE_FORM_URLENCODED,
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          app.log.error({ error }, 'Token refresh failed');
          return reply.code(401).send({ error: 'Invalid refresh token' });
        }

        const tokenData = (await response.json()) as KeycloakTokenResponse;

        return reply.send({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        });
      } catch (error) {
        app.log.error({ error }, 'Error refreshing token with Keycloak');
        return reply.code(500).send({ error: 'Token refresh error' });
      }
    },
  });
}

export default fp(keycloakAuthPlugin, {
  name: 'keycloak-auth',
});
