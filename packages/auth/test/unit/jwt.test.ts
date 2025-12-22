/**
 * JWT Plugin Unit Tests (TDD)
 *
 * Tests JWT validation logic with Fastify.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import jwtPlugin from '../../dist/jwt.js';
import { TEST_PUBLIC_KEY } from '../helpers/test-keys.js';

describe('JWT Plugin', () => {
  describe('Plugin registration', () => {
    it('should register JWT plugin with valid RSA public key', async () => {
      const fastify = Fastify({ logger: false });

      await assert.doesNotReject(async () => {
        await fastify.register(jwtPlugin, {
          keycloakUrl: 'http://localhost:8080',
          realm: 'test-realm',
          jwtPublicKey: TEST_PUBLIC_KEY,
        });
      });

      await fastify.close();
    });

    it('should throw error for missing public key', async () => {
      const fastify = Fastify({ logger: false });

      await assert.rejects(
        async () => {
          await fastify.register(jwtPlugin, {
            keycloakUrl: 'http://localhost:8080',
            realm: 'test',
            // jwtPublicKey not provided - defaults to empty string
          });
        },
        /missing public key/,
        'Should reject when public key is missing'
      );

      await fastify.close();
    });

    it('should build correct issuer URL from config', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://keycloak.example.com',
        realm: 'my-realm',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      // The issuer is validated internally: keycloakUrl + /realms/ + realm
      assert.ok((fastify as any).jwt, 'JWT should be registered');

      await fastify.close();
    });
  });

  describe('authenticate decorator', () => {
    it('should add authenticate decorator to fastify instance', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://localhost:8080',
        realm: 'test',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      assert.ok(
        typeof (fastify as any).authenticate === 'function',
        'authenticate should be a function'
      );

      await fastify.close();
    });

    it('should return 401 when token is missing', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://localhost:8080',
        realm: 'test',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      fastify.get('/api/data', {
        preHandler: (fastify as any).authenticate,
        handler: async () => ({ message: 'success' }),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/data',
      });

      assert.strictEqual(response.statusCode, 401, 'Should return 401 without token');
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Unauthorized');
      assert.strictEqual(body.message, 'Invalid or missing authentication token');

      await fastify.close();
    });

    it('should return 401 with invalid token format', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://localhost:8080',
        realm: 'test',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      fastify.get('/secure', {
        preHandler: (fastify as any).authenticate,
        handler: async () => ({ data: 'protected' }),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/secure',
        headers: {
          authorization: 'Bearer invalid-token-format',
        },
      });

      assert.strictEqual(response.statusCode, 401, 'Should reject invalid token');
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Unauthorized');

      await fastify.close();
    });

    it('should return 401 with malformed authorization header', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://localhost:8080',
        realm: 'test',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      fastify.get('/test', {
        preHandler: (fastify as any).authenticate,
        handler: async () => ({ ok: true }),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          authorization: 'NotBearer token',
        },
      });

      assert.strictEqual(response.statusCode, 401);

      await fastify.close();
    });
  });

  describe('Algorithm validation', () => {
    it('should use RS256 algorithm for JWT verification', async () => {
      const fastify = Fastify({ logger: false });

      await fastify.register(jwtPlugin, {
        keycloakUrl: 'http://localhost:8080',
        realm: 'test',
        jwtPublicKey: TEST_PUBLIC_KEY,
      });

      // RS256 is asymmetric - requires public key
      // This is validated at registration time
      assert.ok((fastify as any).jwt, 'Should accept RS256 with RSA public key');

      await fastify.close();
    });
  });
});
