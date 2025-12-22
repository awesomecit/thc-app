/**
 * In-Memory Session Repository (Test Double)
 *
 * Fake implementation for testing - no external dependencies.
 */

import type { SessionRepository } from '../../application/ports/session-repository.port.js';
import type { SessionData } from '../../domain/entities/session.entity.js';

interface StoredSession {
  data: SessionData;
  expiresAt: number; // Unix timestamp
}

export class InMemorySessionRepository implements SessionRepository {
  private storage = new Map<string, StoredSession>();

  save(sessionId: string, session: SessionData, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.storage.set(sessionId, { data: session, expiresAt });
    return Promise.resolve();
  }

  get(sessionId: string): Promise<SessionData | null> {
    const stored = this.storage.get(sessionId);

    if (!stored) {
      return Promise.resolve(null);
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      this.storage.delete(sessionId);
      return Promise.resolve(null);
    }

    return Promise.resolve(stored.data);
  }

  delete(sessionId: string): Promise<void> {
    this.storage.delete(sessionId);
    return Promise.resolve();
  }

  async exists(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    return session !== null;
  }

  getTTL(sessionId: string): Promise<number> {
    const stored = this.storage.get(sessionId);

    if (!stored) {
      return Promise.resolve(-2); // Redis convention: key doesn't exist
    }

    const ttl = Math.floor((stored.expiresAt - Date.now()) / 1000);
    return Promise.resolve(ttl > 0 ? ttl : -1); // Redis convention: -1 = no expiry
  }

  /**
   * Test helper: clear all sessions
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Test helper: get storage size
   */
  size(): number {
    return this.storage.size;
  }
}
