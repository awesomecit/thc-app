/**
 * E2E Auth Flow Tests - Complete Watt Runtime
 *
 * Tests the full authentication flow through Platformatic Watt:
 * - Gateway proxy routing (/api/auth → thc-auth-service)
 * - Keycloak token acquisition
 * - JWT validation across services
 * - Session management with Redis
 *
 * Uses child_process to spawn wattpm CLI for complete stack testing.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { GenericContainer, Wait } from 'testcontainers';
import type { StartedTestContainer } from 'testcontainers';

describe('E2E Auth Flow with Watt Runtime', () => {
  let wattProcess: ChildProcess;
  let baseUrl: string;
  let keycloak: StartedTestContainer;
  let redis: StartedTestContainer;
  let keycloakUrl: string;

  before(
    async () => {
      console.log('🔐 Starting Keycloak container...');
      keycloak = await new GenericContainer('quay.io/keycloak/keycloak:23.0')
        .withCommand(['start-dev', '--import-realm'])
        .withCopyFilesToContainer([
          {
            source: join(
              import.meta.dirname,
              '../../web/thc-auth-service/test/fixtures/test-realm.json'
            ),
            target: '/opt/keycloak/data/import/test-realm.json',
          },
        ])
        .withEnvironment({
          KEYCLOAK_ADMIN: 'admin',
          KEYCLOAK_ADMIN_PASSWORD: 'admin',
        })
        .withExposedPorts(8080)
        .withWaitStrategy(Wait.forHttp('/health/ready', 8080).withStartupTimeout(180000))
        .start();

      const keycloakPort = keycloak.getMappedPort(8080);
      keycloakUrl = `http://localhost:${keycloakPort}`;
      console.log(`✅ Keycloak running at ${keycloakUrl}`);

      console.log('🔐 Starting Redis container...');
      redis = await new GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
        .start();

      const redisPort = redis.getMappedPort(6379);
      console.log(`✅ Redis running at localhost:${redisPort}`);

      console.log('🚀 Starting Watt runtime via wattpm...');

      // Start wattpm as child process
      wattProcess = spawn('npx', ['wattpm', 'start'], {
        cwd: join(import.meta.dirname, '../..'),
        env: {
          ...process.env,
          PLT_KEYCLOAK_URL: keycloakUrl,
          PLT_KEYCLOAK_REALM: 'thc-test',
          PLT_KEYCLOAK_CLIENT_ID: 'thc-test-client',
          REDIS_HOST: 'localhost',
          REDIS_PORT: redisPort.toString(),
          PORT: '0', // Random port
        },
        stdio: 'pipe',
      });

      // Capture output to find the port
      await new Promise<void>((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(() => {
          reject(new Error('Watt startup timeout'));
        }, 60000);

        wattProcess.stdout?.on('data', (data: Buffer) => {
          output += data.toString();
          console.log(data.toString());

          // Look for port in output
          const portMatch = output.match(/listening.*:(\d+)/i);
          if (portMatch) {
            clearTimeout(timeout);
            baseUrl = `http://localhost:${portMatch[1]}`;
            console.log(`✅ Watt running at ${baseUrl}`);
            resolve();
          }
        });

        wattProcess.stderr?.on('data', (data: Buffer) => {
          console.error(data.toString());
        });

        wattProcess.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    },
    { timeout: 180000 }
  ); // 3 minutes timeout for container startup

  after(async () => {
    console.log('🧹 Cleanup: stopping services...');
    if (wattProcess) {
      wattProcess.kill('SIGTERM');
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        wattProcess.on('exit', resolve);
        setTimeout(() => {
          wattProcess.kill('SIGKILL');
          resolve(undefined);
        }, 5000);
      });
    }
    if (keycloak) {
      await keycloak.stop();
    }
    if (redis) {
      await redis.stop();
    }
    console.log('✅ Cleanup complete');
  });

  test('Gateway routes /api/auth to thc-auth-service', async () => {
    // This tests the gateway proxy configuration
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
      }),
    });

    assert.equal(response.status, 200, 'Gateway should proxy to auth service successfully');

    const data = await response.json();
    assert.ok(data.access_token, 'Should receive access token');
    assert.ok(data.refresh_token, 'Should receive refresh token');
    assert.equal(data.token_type, 'Bearer');
  });

  test('Token validation through gateway', async () => {
    // 1. Get token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
      }),
    });

    const { access_token } = await loginResponse.json();

    // 2. Validate token
    const validateResponse = await fetch(`${baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: access_token }),
    });

    assert.equal(validateResponse.status, 200);

    const validation = await validateResponse.json();
    assert.ok(validation.valid, 'Token should be valid');
    assert.ok(validation.payload, 'Should include decoded payload');
    assert.equal(validation.payload.preferred_username, 'testuser');
  });

  test('Token refresh flow through gateway', async () => {
    // 1. Get initial token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
      }),
    });

    const { refresh_token } = await loginResponse.json();

    // 2. Use refresh token to get new access token
    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh_token }),
    });

    assert.equal(refreshResponse.status, 200);

    const refreshData = await refreshResponse.json();
    assert.ok(refreshData.access_token, 'Should receive new access token');
    assert.ok(refreshData.refresh_token, 'Should receive new refresh token');
  });

  test('Invalid credentials return 401', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'wrongpassword',
      }),
    });

    assert.equal(response.status, 401, 'Should reject invalid credentials');
  });

  test('Protected endpoints require valid token', async () => {
    // Assuming thc-db has protected endpoints
    const response = await fetch(`${baseUrl}/api/db/users/me`);

    // Without token, should get 401
    assert.equal(response.status, 401, 'Protected endpoint should require authentication');
  });

  test('Protected endpoints accept valid token', async () => {
    // 1. Get token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
      }),
    });

    const { access_token } = await loginResponse.json();

    // 2. Access protected endpoint
    const response = await fetch(`${baseUrl}/api/db/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    // Should either return 200 with data or 404 if endpoint doesn't exist yet
    // But NOT 401
    assert.ok([200, 404].includes(response.status), 'Should accept valid token');
    assert.notEqual(response.status, 401, 'Valid token should not return 401');
  });
});
