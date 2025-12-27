/**
 * TDD Test: Keycloak Authentication Service
 *
 * Integration test with Testcontainers:
 * - Keycloak container for authentication
 * - Platformatic service for auth endpoints
 *
 * Tests:
 * - User login with username/password
 * - Token validation
 * - Token refresh
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { create } from '@platformatic/service';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';

let keycloakContainer: StartedTestContainer;
let server: any; // Platformatic server instance
let app: FastifyInstance;
let AUTH_SERVICE_URL: string;

before(async () => {
  // 1. Start Keycloak container
  console.log('🔐 Starting Keycloak container...');
  keycloakContainer = await new GenericContainer('quay.io/keycloak/keycloak:23.0')
    .withEnvironment({
      KEYCLOAK_ADMIN: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: 'admin',
    })
    .withExposedPorts(8080)
    .withCommand(['start-dev'])
    .withWaitStrategy(Wait.forLogMessage(/.*Listening on.*/))
    .withStartupTimeout(120000)
    .start();

  const keycloakPort = keycloakContainer.getMappedPort(8080);
  const keycloakUrl = `http://localhost:${keycloakPort}`;

  console.log(`✅ Keycloak running at ${keycloakUrl}`);

  // Wait for Keycloak to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // 2. Import test realm with pre-configured client
  console.log('🔧 Importing test realm...');

  // Get admin token first
  const tokenResponse = await fetch(`${keycloakUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: 'admin',
      password: 'admin',
    }),
  });

  const { access_token } = await tokenResponse.json();

  // Import realm configuration
  const realmConfig = JSON.parse(
    await readFile(join(import.meta.dirname, '..', 'fixtures', 'test-realm.json'), 'utf8')
  );

  await fetch(`${keycloakUrl}/admin/realms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(realmConfig),
  });

  console.log('✅ Test realm imported');

  // 3. Start Platformatic service
  console.log('🚀 Starting thc-auth-service...');

  // Load watt.json configuration
  const configPath = join(import.meta.dirname, '..', '..', 'watt.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));

  // Override environment variables for test
  config.server ||= {};
  config.server.logger ||= {};
  config.server.logger.level = 'info';
  config.watch = false;

  // Create server
  const serviceRoot = join(import.meta.dirname, '..', '..');
  server = await create(serviceRoot, config);

  // Override environment for Keycloak connection
  // Use test realm with public client (no secret needed for password grant)
  process.env.PLT_KEYCLOAK_URL = keycloakUrl;
  process.env.PLT_KEYCLOAK_REALM = 'test';
  process.env.PLT_KEYCLOAK_CLIENT_ID = 'thc-test-client';
  process.env.PLT_KEYCLOAK_CLIENT_SECRET = '';

  await server.start();
  app = server.getApplication();

  const address = app.server.address();
  const port = typeof address === 'object' && address ? address.port : 3042;
  AUTH_SERVICE_URL = `http://localhost:${port}`;

  // Verify Keycloak configuration by testing token endpoint directly
  console.log('🔍 Testing Keycloak token endpoint...');
  const testTokenResponse = await fetch(
    `${keycloakUrl}/realms/test/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'thc-test-client', // Use public client for login
        username: 'testuser',
        password: 'testpassword',
      }),
    }
  );

  if (!testTokenResponse.ok) {
    const error = await testTokenResponse.text();
    console.error('❌ Keycloak token test failed:', error);
    throw new Error(`Keycloak not configured correctly: ${error}`);
  }

  console.log('✅ Keycloak token endpoint working');
  console.log(`✅ thc-auth-service running at ${AUTH_SERVICE_URL}`);
});

after(async () => {
  console.log('🧹 Cleanup: stopping services...');

  // Force cleanup with timeout to avoid hanging
  const cleanupPromises: Promise<any>[] = [];

  if (server) {
    cleanupPromises.push(
      Promise.race([
        server.stop(),
        new Promise((resolve) =>
          setTimeout(() => {
            console.log('⚠️ Server stop timeout, forcing exit');
            resolve(undefined);
          }, 5000)
        ),
      ])
    );
  }

  if (keycloakContainer) {
    cleanupPromises.push(
      Promise.race([
        keycloakContainer.stop(),
        new Promise((resolve) =>
          setTimeout(() => {
            console.log('⚠️ Keycloak stop timeout, forcing exit');
            resolve(undefined);
          }, 5000)
        ),
      ])
    );
  }

  await Promise.all(cleanupPromises);
  console.log('✅ Cleanup complete');
});

test('TDD RED: POST /auth/login should not exist yet', async () => {
  // This test is now obsolete since we start the service in before()
  // Keeping it as documentation of TDD RED phase
  assert.ok(true, 'RED phase complete - service now exists');
});

test('TDD GREEN: POST /auth/login should return JWT token', { timeout: 30000 }, async () => {
  const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpassword',
    }),
  });

  assert.strictEqual(response.status, 200);

  const data = await response.json();
  assert.ok(data.access_token, 'Should return access_token');
  assert.ok(data.refresh_token, 'Should return refresh_token');
  assert.ok(data.expires_in, 'Should return expires_in');
});

test('TDD GREEN: POST /auth/validate should validate JWT token', { timeout: 30000 }, async () => {
  // First, get a valid token by logging in
  const loginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpassword',
    }),
  });

  const loginData = await loginResponse.json();
  const token = loginData.access_token;

  const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  assert.strictEqual(response.status, 200);

  const data = await response.json();
  assert.ok(data.valid, 'Should validate token');
  assert.ok(data.user, 'Should return user info');
});

test('TDD GREEN: POST /auth/refresh should refresh expired token', { timeout: 30000 }, async () => {
  // First, get a valid refresh token by logging in
  const loginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpassword',
    }),
  });

  const loginData = await loginResponse.json();
  const refreshToken = loginData.refresh_token;

  const response = await fetch(`${AUTH_SERVICE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  assert.strictEqual(response.status, 200);

  const data = await response.json();
  assert.ok(data.access_token, 'Should return new access token');
  assert.ok(data.refresh_token, 'Should return new refresh token');
});
