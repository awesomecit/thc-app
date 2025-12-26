/**
 * RedisSessionAdapter Integration Tests
 *
 * Tests Redis adapter with real Redis container via Testcontainers.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import { Redis } from 'ioredis';
import { RedisSessionRepository } from '../../dist/infrastructure/adapters/redis-session.adapter.js';
import type { SessionData } from '../../dist/domain/entities/session.entity.js';

describe('RedisSessionRepository Integration Tests', () => {
  let redisContainer: StartedRedisContainer;
  let redis: Redis;
  let adapter: RedisSessionRepository;

  before(async () => {
    // Start Redis container
    redisContainer = await new RedisContainer('redis:7-alpine').start();

    // Initialize Redis client
    redis = new Redis({
      host: redisContainer.getHost(),
      port: redisContainer.getMappedPort(6379),
    });

    // Initialize adapter with real Redis
    adapter = new RedisSessionRepository(redis);
  });

  after(async () => {
    if (redis) {
      await redis.quit();
    }
    if (redisContainer) {
      await redisContainer.stop();
    }
  });

  it('should save and retrieve a session', async () => {
    const sessionData: SessionData = {
      userId: 'user-123',
      email: 'test@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    await adapter.save('session-1', sessionData, 3600);

    const retrieved = await adapter.get('session-1');

    assert.deepStrictEqual(retrieved, sessionData);
  });

  it('should return null for non-existent session', async () => {
    const result = await adapter.get('non-existent');
    assert.strictEqual(result, null);
  });

  it('should delete a session', async () => {
    const sessionData: SessionData = {
      userId: 'user-456',
      email: 'delete@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    await adapter.save('session-delete', sessionData, 3600);

    // Verify it exists
    const before = await adapter.get('session-delete');
    assert.deepStrictEqual(before, sessionData);

    // Delete it
    await adapter.delete('session-delete');

    // Verify it's gone
    const after = await adapter.get('session-delete');
    assert.strictEqual(after, null);
  });

  it('should respect TTL and expire sessions', async () => {
    const sessionData: SessionData = {
      userId: 'user-ttl',
      email: 'ttl@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 2000,
    };

    // Save with 2 second TTL
    await adapter.save('session-ttl', sessionData, 2);

    // Should exist immediately
    const immediate = await adapter.get('session-ttl');
    assert.deepStrictEqual(immediate, sessionData);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Should be expired
    const expired = await adapter.get('session-ttl');
    assert.strictEqual(expired, null);
  });

  it('should get remaining TTL for a session', async () => {
    const sessionData: SessionData = {
      userId: 'user-ttl-check',
      email: 'ttl-check@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    await adapter.save('session-ttl-check', sessionData, 3600);

    const ttl = await adapter.getTTL('session-ttl-check');

    // TTL should be close to 3600 seconds (allow 5 second margin)
    assert.ok(ttl > 3595, `TTL ${ttl} should be greater than 3595`);
    assert.ok(ttl <= 3600, `TTL ${ttl} should be <= 3600`);
  });

  it('should return -1 TTL for non-existent session', async () => {
    const ttl = await adapter.getTTL('non-existent-ttl');
    assert.strictEqual(ttl, -1);
  });

  it('should handle concurrent operations', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      key: `session-concurrent-${i}`,
      data: {
        userId: `user-${i}`,
        email: `user${i}@example.com`,
        userType: 'domain' as const,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      } as SessionData,
    }));

    // Save all sessions concurrently
    await Promise.all(sessions.map(({ key, data }) => adapter.save(key, data, 3600)));

    // Retrieve all sessions concurrently
    const results = await Promise.all(sessions.map(({ key }) => adapter.get(key)));

    // Verify all sessions were saved correctly
    results.forEach((result, i) => {
      assert.deepStrictEqual(result, sessions[i].data);
    });

    // Clean up
    await Promise.all(sessions.map(({ key }) => adapter.delete(key)));
  });

  it('should handle malformed data gracefully', async () => {
    // Manually insert invalid JSON into Redis
    await redis.set('session:session-malformed', 'invalid-json', 'EX', 60);

    const result = await adapter.get('session-malformed');
    assert.strictEqual(result, null);
  });

  it('should update session TTL on save', async () => {
    const sessionData: SessionData = {
      userId: 'user-update-ttl',
      email: 'update-ttl@example.com',
      userType: 'domain' as const,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000000,
    };

    // Save with initial TTL
    await adapter.save('session-update-ttl', sessionData, 60);

    const ttl1 = await adapter.getTTL('session-update-ttl');
    assert.ok(ttl1 > 55, `Initial TTL ${ttl1} should be > 55`);
    assert.ok(ttl1 <= 60, `Initial TTL ${ttl1} should be <= 60`);

    // Update with new TTL
    await adapter.save('session-update-ttl', sessionData, 120);

    const ttl2 = await adapter.getTTL('session-update-ttl');
    assert.ok(ttl2 > 115, `Updated TTL ${ttl2} should be > 115`);
    assert.ok(ttl2 <= 120, `Updated TTL ${ttl2} should be <= 120`);
  });
});
