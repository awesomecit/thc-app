/**
 * Session Repository Port (Application Layer)
 *
 * Interface for session storage operations.
 * Implementations: Redis, In-Memory (test), PostgreSQL, etc.
 */

import type { SessionData } from '../../domain/entities/session.entity.js';

export interface SessionRepository {
  /**
   * Save a session to storage
   */
  save(sessionId: string, session: SessionData, ttlSeconds: number): Promise<void>;

  /**
   * Get a session from storage
   */
  get(sessionId: string): Promise<SessionData | null>;

  /**
   * Delete a session from storage
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Check if a session exists
   */
  exists(sessionId: string): Promise<boolean>;

  /**
   * Get remaining TTL for a session (in seconds)
   */
  getTTL(sessionId: string): Promise<number>;
}
