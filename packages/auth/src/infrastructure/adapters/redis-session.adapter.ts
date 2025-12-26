/**
 * Redis Session Repository Adapter (Infrastructure Layer)
 *
 * Redis implementation of SessionRepository port.
 */

import type { Redis } from 'ioredis';
import type { SessionRepository } from '../../application/ports/session-repository.port.js';
import type { SessionData } from '../../domain/entities/session.entity.js';

export class RedisSessionRepository implements SessionRepository {
  private readonly keyPrefix = 'session:';

  constructor(private readonly redis: Redis) {}

  async save(sessionId: string, session: SessionData, ttlSeconds: number): Promise<void> {
    const key = this.buildKey(sessionId);
    await this.redis.setex(key, ttlSeconds, JSON.stringify(session));
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const key = this.buildKey(sessionId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as SessionData;
    } catch {
      // Return null if JSON parsing fails (malformed data)
      return null;
    }
  }

  async delete(sessionId: string): Promise<void> {
    const key = this.buildKey(sessionId);
    await this.redis.del(key);
  }

  async exists(sessionId: string): Promise<boolean> {
    const key = this.buildKey(sessionId);
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async getTTL(sessionId: string): Promise<number> {
    const key = this.buildKey(sessionId);
    const ttl = await this.redis.ttl(key);
    // Redis returns -2 when key doesn't exist, normalize to -1
    return ttl === -2 ? -1 : ttl;
  }

  private buildKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }
}

// Alias export for compatibility
export { RedisSessionRepository as RedisSessionAdapter };
