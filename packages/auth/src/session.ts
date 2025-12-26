/**
 * Session Manager
 *
 * Advanced session management with sliding window TTL and auto-refresh.
 * Used for managing user sessions in Redis with activity tracking.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Redis } from 'ioredis';

export interface SessionData {
  userId: string;
  userType: 'domain' | 'service';
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  lastActivity?: number;
  createdAt?: number;
}

export interface SessionConfig {
  ttl: number; // seconds
  slidingWindowEnabled: boolean;
  slidingWindowThreshold: number; // seconds
  refreshThreshold: number; // seconds
  enableAutoRefresh: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  ttl: 3600, // 1 hour
  slidingWindowEnabled: true,
  slidingWindowThreshold: 300, // 5 minutes
  refreshThreshold: 300, // 5 minutes
  enableAutoRefresh: true,
};

/**
 * Session Manager with sliding window and auto-refresh
 */
export class SessionManager {
  private redis: Redis;
  private config: SessionConfig;
  private keycloakUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor(
    redis: Redis,
    config: Partial<SessionConfig> = {},
    keycloakConfig: { url: string; clientId: string; clientSecret: string }
  ) {
    this.redis = redis;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.keycloakUrl = keycloakConfig.url;
    this.clientId = keycloakConfig.clientId;
    this.clientSecret = keycloakConfig.clientSecret;
  }

  /**
   * Get session from Redis with activity tracking
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const session = JSON.parse(data) as SessionData;

    // Try auto-refresh if enabled
    if (this.config.enableAutoRefresh && this.shouldRefreshToken(session)) {
      await this.tryRefreshToken(sessionId, session);
    }

    // Update activity and TTL
    const ttl = await this.calculateTTL(key, session);
    await this.updateSession(key, session, ttl);

    return session;
  }

  /**
   * Save session to Redis
   */
  async saveSession(sessionId: string, session: SessionData): Promise<void> {
    const key = `session:${sessionId}`;
    const now = Date.now();

    session.createdAt ??= now;
    session.lastActivity = now;

    await this.redis.setex(key, this.config.ttl, JSON.stringify(session));
  }

  /**
   * Delete session from Redis
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  /**
   * Check if access token should be refreshed
   */
  private shouldRefreshToken(session: SessionData): boolean {
    const timeUntilExpiry = session.expiresAt - Date.now();
    return timeUntilExpiry < this.config.refreshThreshold * 1000;
  }

  /**
   * Try to refresh token if needed
   */
  private async tryRefreshToken(sessionId: string, session: SessionData): Promise<void> {
    if (!session.refreshToken) {
      return;
    }

    try {
      const refreshed = await this.refreshAccessToken(session.refreshToken);
      if (refreshed) {
        session.accessToken = refreshed.accessToken;
        session.refreshToken = refreshed.refreshToken ?? session.refreshToken;
        session.expiresAt = refreshed.expiresAt;
        await this.saveSession(sessionId, session);
      }
    } catch (error) {
      console.warn('Token refresh failed, using existing token', error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
  } | null> {
    try {
      const response = await fetch(`${this.keycloakUrl}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokens = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      };

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  /**
   * Calculate TTL based on sliding window policy
   */
  private async calculateTTL(key: string, session: SessionData): Promise<number> {
    if (!this.config.slidingWindowEnabled) {
      return this.config.ttl;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - (session.lastActivity ?? session.createdAt ?? now);

    // Extend to full TTL if activity within threshold
    if (timeSinceLastActivity < this.config.slidingWindowThreshold * 1000) {
      return this.config.ttl;
    }

    // Otherwise keep existing TTL
    const existingTtl = await this.redis.ttl(key);
    return existingTtl > 0 ? existingTtl : this.config.ttl;
  }

  /**
   * Update session activity and save to Redis
   */
  private async updateSession(key: string, session: SessionData, ttl: number): Promise<void> {
    session.lastActivity = Date.now();
    await this.redis.setex(key, ttl, JSON.stringify(session));
  }

  /**
   * Cleanup expired sessions (background job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    let count = 0;
    const keys = await this.redis.keys('session:*');

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // No expiration set, delete stale session
        await this.redis.del(key);
        count++;
      }
    }

    return count;
  }
}

/**
 * Fastify plugin for session management
 */
export const sessionManagerPlugin = fp(
  function (
    fastify: FastifyInstance,
    opts: {
      redis: Redis;
      config?: Partial<SessionConfig>;
      keycloak: { url: string; clientId: string; clientSecret: string };
    }
  ) {
    const manager = new SessionManager(opts.redis, opts.config, opts.keycloak);

    fastify.decorate('sessionManager', manager);

    // Middleware to track activity
    fastify.addHook('onRequest', async (request: FastifyRequest) => {
      const sessionWithId = request.session as { id?: string };
      const sessionId = sessionWithId.id;
      if (sessionId) {
        await manager.getSession(sessionId);
      }
    });

    // Cleanup job (run every hour)
    if (process.env.NODE_ENV !== 'test') {
      setInterval(
        () => {
          void (async () => {
            const cleaned = await manager.cleanupExpiredSessions();
            if (cleaned > 0) {
              fastify.log.info({ cleaned }, 'Cleaned up expired sessions');
            }
          })();
        },
        60 * 60 * 1000
      ); // 1 hour
    }
  },
  { name: 'sessionManager', fastify: '5.x' }
);

declare module 'fastify' {
  interface FastifyInstance {
    sessionManager: SessionManager;
  }
}
