/**
 * Session Entity Unit Tests (TDD)
 *
 * Tests pure domain logic without external dependencies.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Session, type SessionData } from '../../dist/domain/entities/session.entity.js';

describe('Session Entity (Domain)', () => {
  const validSessionData: Omit<SessionData, 'createdAt' | 'lastActivity'> = {
    userId: 'user-123',
    userType: 'domain',
    email: 'test@example.com',
    accessToken: 'valid-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: Date.now() + 3600 * 1000, // 1 hour from now
  };

  describe('Session.create()', () => {
    it('should create a valid session with timestamps', () => {
      const session = Session.create(validSessionData);

      assert.strictEqual(session.userId, validSessionData.userId);
      assert.strictEqual(session.email, validSessionData.email);
      assert.strictEqual(session.accessToken, validSessionData.accessToken);
      assert.ok(session.createdAt, 'createdAt should be set');
      assert.ok(session.lastActivity, 'lastActivity should be set');
    });

    it('should throw error for empty userId', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            userId: '',
          }),
        /Session must have a valid userId/
      );
    });

    it('should throw error for whitespace-only userId', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            userId: '   ',
          }),
        /Session must have a valid userId/
      );
    });

    it('should throw error for invalid email', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            email: 'not-an-email',
          }),
        /Session must have a valid email/
      );
    });

    it('should throw error for empty email', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            email: '',
          }),
        /Session must have a valid email/
      );
    });

    it('should throw error for empty accessToken', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            accessToken: '',
          }),
        /Session must have a valid accessToken/
      );
    });

    it('should throw error for invalid expiresAt (zero)', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            expiresAt: 0,
          }),
        /Session must have a valid expiresAt/
      );
    });

    it('should throw error for negative expiresAt', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            expiresAt: -1000,
          }),
        /Session must have a valid expiresAt/
      );
    });

    it('should throw error for invalid userType', () => {
      assert.throws(
        () =>
          Session.create({
            ...validSessionData,
            userType: 'invalid' as any,
          }),
        /Session userType must be domain or service/
      );
    });

    it('should accept userType "service"', () => {
      const session = Session.create({
        ...validSessionData,
        userType: 'service',
      });

      assert.strictEqual(session.userType, 'service');
    });
  });

  describe('Session.restore()', () => {
    it('should restore session from stored data', () => {
      const storedData: SessionData = {
        ...validSessionData,
        createdAt: Date.now() - 1000,
        lastActivity: Date.now() - 500,
      };

      const session = Session.restore(storedData);

      assert.strictEqual(session.userId, storedData.userId);
      assert.strictEqual(session.createdAt, storedData.createdAt);
      assert.strictEqual(session.lastActivity, storedData.lastActivity);
    });

    it('should validate restored data', () => {
      const invalidData: SessionData = {
        ...validSessionData,
        userId: '',
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      assert.throws(() => Session.restore(invalidData), /Session must have a valid userId/);
    });
  });

  describe('isExpired()', () => {
    it('should return false for non-expired session', () => {
      const session = Session.create({
        ...validSessionData,
        expiresAt: Date.now() + 3600 * 1000, // 1 hour future
      });

      assert.strictEqual(session.isExpired(), false);
    });

    it('should return true for expired session', () => {
      const session = Session.create({
        ...validSessionData,
        expiresAt: Date.now() - 1000, // 1 second past
      });

      assert.strictEqual(session.isExpired(), true);
    });

    it('should accept custom timestamp for testing', () => {
      const expiresAt = Date.now() + 1000;
      const session = Session.create({
        ...validSessionData,
        expiresAt,
      });

      // Test with time before expiration
      assert.strictEqual(session.isExpired(expiresAt - 500), false);

      // Test with time after expiration
      assert.strictEqual(session.isExpired(expiresAt + 500), true);
    });
  });

  describe('needsRefresh()', () => {
    it('should return true when close to expiration', () => {
      const now = Date.now();
      const session = Session.create({
        ...validSessionData,
        expiresAt: now + 200 * 1000, // 200 seconds from now
      });

      // Needs refresh if threshold is 300 seconds
      assert.strictEqual(session.needsRefresh(300, now), true);
    });

    it('should return false when not close to expiration', () => {
      const now = Date.now();
      const session = Session.create({
        ...validSessionData,
        expiresAt: now + 3600 * 1000, // 1 hour from now
      });

      // Does not need refresh if threshold is 300 seconds (5 min)
      assert.strictEqual(session.needsRefresh(300, now), false);
    });

    it('should use Date.now() by default', () => {
      const session = Session.create({
        ...validSessionData,
        expiresAt: Date.now() + 100 * 1000, // 100 seconds from now
      });

      // Should need refresh with 300 second threshold
      assert.strictEqual(session.needsRefresh(300), true);
    });
  });

  describe('updateActivity()', () => {
    it('should return new session with updated lastActivity', () => {
      const originalSession = Session.create(validSessionData);
      const originalActivity = originalSession.lastActivity;

      // Wait a bit
      const newTimestamp = Date.now() + 1000;
      const updatedSession = originalSession.updateActivity(newTimestamp);

      assert.notStrictEqual(
        updatedSession.lastActivity,
        originalActivity,
        'lastActivity should be different'
      );
      assert.strictEqual(updatedSession.lastActivity, newTimestamp);
      assert.strictEqual(
        updatedSession.userId,
        originalSession.userId,
        'userId should remain the same'
      );
    });

    it('should be immutable (return new instance)', () => {
      const original = Session.create(validSessionData);
      const updated = original.updateActivity();

      assert.notStrictEqual(original, updated, 'Should return a new instance');
    });
  });

  describe('toData()', () => {
    it('should serialize session to SessionData', () => {
      const session = Session.create(validSessionData);
      const data = session.toData();

      assert.strictEqual(data.userId, validSessionData.userId);
      assert.strictEqual(data.email, validSessionData.email);
      assert.ok(data.createdAt, 'createdAt should be present');
      assert.ok(data.lastActivity, 'lastActivity should be present');
    });

    it('should return a copy (not reference)', () => {
      const session = Session.create(validSessionData);
      const data1 = session.toData();
      const data2 = session.toData();

      assert.notStrictEqual(data1, data2, 'Should return a new object');
      assert.deepStrictEqual(data1, data2, 'Should have same values');
    });
  });

  describe('Getters', () => {
    it('should provide read-only access to properties', () => {
      const session = Session.create(validSessionData);

      assert.strictEqual(session.userId, validSessionData.userId);
      assert.strictEqual(session.email, validSessionData.email);
      assert.strictEqual(session.accessToken, validSessionData.accessToken);
      assert.strictEqual(session.refreshToken, validSessionData.refreshToken);
      assert.strictEqual(session.expiresAt, validSessionData.expiresAt);
      assert.strictEqual(session.userType, validSessionData.userType);
      assert.ok(session.createdAt);
      assert.ok(session.lastActivity);
    });
  });

  describe('Email validation', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@sub.example.com',
    ];

    const invalidEmails = [
      'not-an-email',
      '@example.com',
      'user@',
      'user',
      '',
      'user @example.com',
      'user@example',
    ];

    validEmails.forEach((email) => {
      it(`should accept valid email: ${email}`, () => {
        const session = Session.create({
          ...validSessionData,
          email,
        });

        assert.strictEqual(session.email, email);
      });
    });

    invalidEmails.forEach((email) => {
      it(`should reject invalid email: "${email}"`, () => {
        assert.throws(
          () =>
            Session.create({
              ...validSessionData,
              email,
            }),
          /Session must have a valid email/
        );
      });
    });
  });
});
