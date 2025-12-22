/**
 * Session Repository Adapter Tests (TDD)
 *
 * Tests for both InMemory (fake) and Redis adapters.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { InMemorySessionRepository } from '../../dist/infrastructure/adapters/in-memory-session.adapter.js';
import type { SessionData } from '../../dist/domain/entities/session.entity.js';

describe('InMemorySessionRepository', () => {
  let repository: InMemorySessionRepository;

  const mockSessionData: SessionData = {
    userId: 'user-123',
    userType: 'domain',
    email: 'test@example.com',
    accessToken: 'access-token-xyz',
    refreshToken: 'refresh-token-abc',
    expiresAt: Date.now() + 3600 * 1000,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  beforeEach(() => {
    repository = new InMemorySessionRepository();
  });

  describe('save() and get()', () => {
    it('should save and retrieve a session', async () => {
      const sessionId = 'session-123';
      const ttl = 3600;

      await repository.save(sessionId, mockSessionData, ttl);
      const retrieved = await repository.get(sessionId);

      assert.ok(retrieved, 'Session should be retrieved');
      assert.strictEqual(retrieved?.userId, mockSessionData.userId);
      assert.strictEqual(retrieved?.email, mockSessionData.email);
    });

    it('should return null for non-existent session', async () => {
      const result = await repository.get('non-existent-session');
      assert.strictEqual(result, null);
    });

    it('should return null for expired session', async () => {
      const sessionId = 'expired-session';
      const ttl = 1; // 1 second TTL

      await repository.save(sessionId, mockSessionData, ttl);

      // Wait for expiration (simulate time passing)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = await repository.get(sessionId);
      assert.strictEqual(result, null, 'Expired session should return null');
    });

    it('should overwrite existing session', async () => {
      const sessionId = 'session-123';
      const ttl = 3600;

      await repository.save(sessionId, mockSessionData, ttl);

      const updatedData: SessionData = {
        ...mockSessionData,
        email: 'updated@example.com',
      };

      await repository.save(sessionId, updatedData, ttl);
      const retrieved = await repository.get(sessionId);

      assert.strictEqual(retrieved?.email, 'updated@example.com', 'Session should be updated');
    });
  });

  describe('delete()', () => {
    it('should delete an existing session', async () => {
      const sessionId = 'session-delete';
      await repository.save(sessionId, mockSessionData, 3600);

      await repository.delete(sessionId);

      const result = await repository.get(sessionId);
      assert.strictEqual(result, null, 'Deleted session should not exist');
    });

    it('should not throw error when deleting non-existent session', async () => {
      await assert.doesNotReject(async () => await repository.delete('non-existent'));
    });
  });

  describe('exists()', () => {
    it('should return true for existing session', async () => {
      const sessionId = 'session-exists';
      await repository.save(sessionId, mockSessionData, 3600);

      const exists = await repository.exists(sessionId);
      assert.strictEqual(exists, true);
    });

    it('should return false for non-existent session', async () => {
      const exists = await repository.exists('non-existent');
      assert.strictEqual(exists, false);
    });

    it('should return false for expired session', async () => {
      const sessionId = 'expired-exists';
      await repository.save(sessionId, mockSessionData, 1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const exists = await repository.exists(sessionId);
      assert.strictEqual(exists, false, 'Expired session should not exist');
    });
  });

  describe('getTTL()', () => {
    it('should return remaining TTL for existing session', async () => {
      const sessionId = 'session-ttl';
      const ttl = 3600;

      await repository.save(sessionId, mockSessionData, ttl);
      const remainingTTL = await repository.getTTL(sessionId);

      assert.ok(
        remainingTTL > 0 && remainingTTL <= ttl,
        `TTL should be between 0 and ${ttl}, got ${remainingTTL}`
      );
    });

    it('should return -2 for non-existent session (Redis convention)', async () => {
      const ttl = await repository.getTTL('non-existent');
      assert.strictEqual(ttl, -2);
    });

    it('should return negative value for expired session', async () => {
      const sessionId = 'expired-ttl';
      await repository.save(sessionId, mockSessionData, 1);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const ttl = await repository.getTTL(sessionId);
      assert.ok(ttl < 0, 'TTL should be negative for expired session');
    });
  });

  describe('Test helpers', () => {
    it('should clear all sessions', async () => {
      await repository.save('session-1', mockSessionData, 3600);
      await repository.save('session-2', mockSessionData, 3600);

      assert.strictEqual(repository.size(), 2);

      repository.clear();

      assert.strictEqual(repository.size(), 0);
      const result = await repository.get('session-1');
      assert.strictEqual(result, null);
    });

    it('should report correct size', async () => {
      assert.strictEqual(repository.size(), 0);

      await repository.save('s1', mockSessionData, 3600);
      assert.strictEqual(repository.size(), 1);

      await repository.save('s2', mockSessionData, 3600);
      assert.strictEqual(repository.size(), 2);

      await repository.delete('s1');
      assert.strictEqual(repository.size(), 1);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple concurrent saves', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        repository.save(`session-${i}`, mockSessionData, 3600)
      );

      await Promise.all(promises);

      assert.strictEqual(repository.size(), 10);
    });

    it('should handle concurrent get and save operations', async () => {
      const sessionId = 'concurrent-session';
      await repository.save(sessionId, mockSessionData, 3600);

      const operations = [
        repository.get(sessionId),
        repository.save(sessionId, { ...mockSessionData, email: 'new@example.com' }, 3600),
        repository.get(sessionId),
        repository.exists(sessionId),
      ];

      const results = await Promise.all(operations);

      assert.ok(results[0], 'First get should succeed');
      assert.ok(results[2], 'Second get should succeed');
      assert.strictEqual(results[3], true, 'Exists should return true');
    });
  });
});
