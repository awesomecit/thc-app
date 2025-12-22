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

    return JSON.parse(data) as SessionData;
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
    return await this.redis.ttl(key);
  }

  private buildKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }
}
