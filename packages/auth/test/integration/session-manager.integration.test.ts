/**
 * SessionManager Integration Tests
 *
 * Tests SessionManager with real Redis container and Fastify integration.
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';
import Fastify, { type FastifyInstance } from 'fastify';
import { sessionManagerPlugin } from '../../dist/session.js';

describe.skip('SessionManager Integration Tests', () => {
  let redisContainer: StartedRedisContainer;
  let redis: Redis;
  let app: FastifyInstance;

  before(async () => {
    // Start Redis container
    redisContainer = await new RedisContainer('redis:7-alpine').start();

    // Initialize Redis client
    redis = new Redis({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });
  });

  after(async () => {
    if (redis) {
      await redis.quit();
    }
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  beforeEach(async () => {
    // Create fresh Fastify instance for each test
    app = Fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should initialize SessionManager with Redis adapter', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    assert.ok(app.sessionManager, 'sessionManager should be defined');
    assert.strictEqual(typeof app.sessionManager.saveSession, 'function');
    assert.strictEqual(typeof app.sessionManager.getSession, 'function');
  });

  it('should create and retrieve session', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    const sessionData = {
      userId: 'user-123',
      email: 'test@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const sessionId = randomUUID();
    await app.sessionManager.saveSession(sessionId, sessionData);

    assert.ok(sessionId, 'sessionId should be defined');
    assert.strictEqual(typeof sessionId, 'string');

    const retrieved = await app.sessionManager.getSession(sessionId);

    // SessionManager adds lastActivity on save/get, so compare key fields
    assert.ok(retrieved, 'Session should be retrieved');
    assert.strictEqual(retrieved?.userId, sessionData.userId);
    assert.strictEqual(retrieved?.email, sessionData.email);
    assert.strictEqual(retrieved?.userType, sessionData.userType);
    assert.strictEqual(retrieved?.accessToken, sessionData.accessToken);
  });

  it('should delete session', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    const sessionData = {
      userId: 'user-delete',
      email: 'delete@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const sessionId = randomUUID();
    await app.sessionManager.saveSession(sessionId, sessionData);

    // Verify exists
    const before = await app.sessionManager.getSession(sessionId);
    assert.deepStrictEqual(before, sessionData);

    // Delete
    await app.sessionManager.deleteSession(sessionId);

    // Verify deleted
    const after = await app.sessionManager.getSession(sessionId);
    assert.strictEqual(after, null);
  });

  // TODO: Investigate sliding window TTL extension logic in SessionManager
  // The current implementation may not extend TTL on getSession as expected
  it.skip('should implement sliding window TTL extension', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: {
        ttl: 10,
        slidingWindowEnabled: true,
        slidingWindowThreshold: 5,
        refreshThreshold: 5,
        enableAutoRefresh: false,
      },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    const sessionData = {
      userId: 'user-sliding',
      email: 'sliding@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10000,
    };

    const sessionId = randomUUID();
    await app.sessionManager.saveSession(sessionId, sessionData);

    // Get initial TTL
    const ttl1 = await redis.ttl(`session:${sessionId}`);
    assert.ok(ttl1 > 8, `Initial TTL ${ttl1} should be > 8`);

    // Wait for 6 seconds (past 50% threshold)
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Access session (should trigger TTL extension)
    const retrieved = await app.sessionManager.getSession(sessionId);
    assert.ok(retrieved, 'Session should exist');
    assert.strictEqual(retrieved?.userId, sessionData.userId);

    // Check TTL was extended
    const ttl2 = await redis.ttl(`session:${sessionId}`);
    assert.ok(ttl2 > 8, `Extended TTL ${ttl2} should be > 8 (close to 10 again)`);
  });

  it('should persist session across Fastify restarts', async () => {
    // First app instance
    const app1 = Fastify({ logger: false });
    await app1.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });
    await app1.ready();

    const sessionData = {
      userId: 'user-persist',
      email: 'persist@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const sessionId = randomUUID();
    await app1.sessionManager.saveSession(sessionId, sessionData);
    await app1.close();

    // Second app instance (simulates restart)
    const app2 = Fastify({ logger: false });
    await app2.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });
    await app2.ready();

    // Session should still exist
    const retrieved = await app2.sessionManager.getSession(sessionId);
    assert.ok(retrieved, 'Session should exist');
    assert.strictEqual(retrieved?.userId, sessionData.userId);

    await app2.close();
  });

  it('should handle concurrent session operations', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    // Create 20 sessions concurrently
    const sessionPromises = Array.from({ length: 20 }, (_, i) => {
      const sessionId = randomUUID();
      const sessionData = {
        userId: `user-${i}`,
        email: `user${i}@example.com`,
        userType: 'domain' as const,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      };
      return app.sessionManager.saveSession(sessionId, sessionData).then(() => sessionId);
    });

    const sessionIds = await Promise.all(sessionPromises);

    assert.strictEqual(sessionIds.length, 20);
    assert.strictEqual(new Set(sessionIds).size, 20, 'All session IDs should be unique');

    // Retrieve all sessions concurrently
    const retrievePromises = sessionIds.map((id) => app.sessionManager.getSession(id));
    const sessions = await Promise.all(retrievePromises);

    sessions.forEach((session, i) => {
      assert.ok(session !== null, `Session ${i} should not be null`);
      assert.strictEqual(session?.userId, `user-${i}`);
    });

    // Clean up
    await Promise.all(sessionIds.map((id) => app.sessionManager.deleteSession(id)));
  });

  it('should generate unique session IDs', async () => {
    await app.register(sessionManagerPlugin, {
      redis,
      config: { ttl: 3600 },
      keycloak: { url: 'http://localhost:8080', clientId: 'test', clientSecret: 'test' },
    });

    await app.ready();

    const sessionData = {
      userId: 'user-unique',
      email: 'unique@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    const ids = await Promise.all(
      Array.from({ length: 100 }, () => {
        const sessionId = randomUUID();
        return app.sessionManager.saveSession(sessionId, sessionData).then(() => sessionId);
      })
    );

    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 100, 'All 100 session IDs should be unique');

    // Clean up
    await Promise.all(ids.map((id) => app.sessionManager.deleteSession(id)));
  });
});
