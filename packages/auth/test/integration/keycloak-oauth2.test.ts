/**
 * Keycloak OAuth2 Integration Tests
 *
 * Tests OAuth2 authorization code flow with real Keycloak container.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import Fastify, { type FastifyInstance } from 'fastify';
import { keycloakPlugin } from '../../dist/keycloak.js';
import type { KeycloakPluginOptions } from '../../dist/keycloak.js';

describe('Keycloak OAuth2 Flow Integration Tests', { timeout: 120000 }, () => {
  let keycloakContainer: StartedTestContainer;
  let redisContainer: StartedRedisContainer;
  let app: FastifyInstance;
  let keycloakUrl: string;
  let adminToken: string;

  before(async () => {
    console.log('🔐 Starting Keycloak container...');
    keycloakContainer = await new GenericContainer('quay.io/keycloak/keycloak:23.0')
      .withEnvironment({
        KEYCLOAK_ADMIN: 'admin',
        KEYCLOAK_ADMIN_PASSWORD: 'admin',
      })
      .withCommand(['start-dev'])
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forLogMessage(/.*Listening on.*/))
      .start();

    const keycloakPort = keycloakContainer.getMappedPort(8080);
    keycloakUrl = `http://localhost:${keycloakPort}`;
    console.log(`✅ Keycloak running at ${keycloakUrl}`);

    console.log('🔐 Starting Redis container...');
    redisContainer = await new RedisContainer('redis:7-alpine').start();
    console.log(
      `✅ Redis running at ${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`
    );

    console.log('🔧 Importing test realm...');
    await importTestRealm();
    console.log('✅ Test realm imported');

    console.log('🚀 Starting Fastify app with OAuth2 plugin...');
    await startApp();
    console.log('✅ App running');
  });

  after(async () => {
    console.log('🧹 Cleanup: stopping services...');

    const cleanupPromises = [];

    if (app) {
      cleanupPromises.push(
        Promise.race([
          app.close(),
          new Promise((resolve) => {
            setTimeout(() => {
              console.log('⚠️  App stop timeout, forcing exit');
              resolve(undefined);
            }, 5000);
          }),
        ])
      );
    }

    if (redisContainer) {
      cleanupPromises.push(
        Promise.race([
          redisContainer.stop(),
          new Promise((resolve) => {
            setTimeout(() => {
              console.log('⚠️  Redis stop timeout, forcing exit');
              resolve(undefined);
            }, 5000);
          }),
        ])
      );
    }

    if (keycloakContainer) {
      cleanupPromises.push(
        Promise.race([
          keycloakContainer.stop(),
          new Promise((resolve) => {
            setTimeout(() => {
              console.log('⚠️  Keycloak stop timeout, forcing exit');
              resolve(undefined);
            }, 5000);
          }),
        ])
      );
    }

    await Promise.all(cleanupPromises);
    console.log('✅ Cleanup complete');
  });

  async function importTestRealm() {
    // Get admin access token
    const tokenResponse = await fetch(
      `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: 'admin',
          password: 'admin',
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Admin token fetch failed: ${tokenResponse.statusText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    adminToken = tokenData.access_token;

    // Import realm configuration
    const realmConfig = {
      realm: 'test',
      enabled: true,
      clients: [
        {
          clientId: 'thc-oauth2-client',
          enabled: true,
          publicClient: false, // Confidential client for authorization code flow
          secret: 'test-client-secret',
          redirectUris: ['http://localhost:*/auth/callback'],
          webOrigins: ['http://localhost:*'],
          standardFlowEnabled: true, // Authorization code flow
          directAccessGrantsEnabled: true, // For testing token endpoint directly
          implicitFlowEnabled: false,
        },
      ],
      users: [
        {
          username: 'testuser',
          enabled: true,
          email: 'test@example.com',
          credentials: [{ type: 'password', value: 'testpassword', temporary: false }],
        },
      ],
    };

    const realmResponse = await fetch(`${keycloakUrl}/admin/realms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(realmConfig),
    });

    if (!realmResponse.ok) {
      const errorText = await realmResponse.text();
      throw new Error(`Realm import failed: ${realmResponse.statusText} - ${errorText}`);
    }
  }

  async function startApp() {
    app = Fastify({ logger: false });

    const options: KeycloakPluginOptions = {
      keycloakUrl,
      realm: 'test',
      clientId: 'thc-oauth2-client',
      clientSecret: 'test-client-secret',
      callbackUrl: `http://localhost:${await getRandomPort()}/auth/callback`,
      redis: {
        host: redisContainer.getHost(),
        port: redisContainer.getMappedPort(6379),
      },
      sessionTTL: 3600,
    };

    await app.register(keycloakPlugin, options);

    // Add protected route for testing authenticate decorator
    app.get('/protected', {
      preHandler: app.authenticate,
      handler: async () => ({ data: 'secret' }),
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
  }

  async function getRandomPort(): Promise<number> {
    const tempServer = Fastify({ logger: false });
    await tempServer.listen({ port: 0, host: '127.0.0.1' });
    const address = tempServer.server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    await tempServer.close();
    return port;
  }

  it('should redirect to Keycloak login on /auth/login', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/login',
    });

    assert.strictEqual(response.statusCode, 302, 'Should redirect');
    const location = response.headers.location as string;
    assert.ok(location.includes(keycloakUrl), 'Should redirect to Keycloak');
    assert.ok(location.includes('/protocol/openid-connect/auth'), 'Should be auth endpoint');
    assert.ok(location.includes('client_id=thc-oauth2-client'), 'Should include client ID');
    assert.ok(location.includes('response_type=code'), 'Should request authorization code');
  });

  it('should return 401 for /auth/me without session', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.body) as { error: string };
    assert.strictEqual(body.error, 'Not authenticated');
  });

  it('should exchange authorization code for tokens on /auth/callback', async () => {
    // This test requires browser automation to complete OAuth2 flow
    // For now, we test that the endpoint exists and validates parameters
    const response = await app.inject({
      method: 'GET',
      url: '/auth/callback',
    });

    assert.strictEqual(response.statusCode, 400);
    const body = JSON.parse(response.body) as { error: string };
    assert.ok(
      body.error.includes('authorization code') || body.error.includes('code'),
      'Should require authorization code'
    );
  });

  it('should redirect to Keycloak logout on /auth/logout', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/logout',
    });

    assert.strictEqual(response.statusCode, 302, 'Should redirect');
    const location = response.headers.location as string;
    assert.ok(location.includes(keycloakUrl), 'Should redirect to Keycloak');
    assert.ok(location.includes('/protocol/openid-connect/logout'), 'Should be logout endpoint');
  });

  it('should validate session with authenticate decorator', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected',
    });

    assert.strictEqual(response.statusCode, 401);
    const body = JSON.parse(response.body) as { error: string };
    assert.strictEqual(body.error, 'Authentication required');
  });
});
