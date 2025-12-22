/**
 * Session Entity (Domain Layer)
 *
 * Pure business logic for session management.
 * No external dependencies - only domain rules.
 */

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

/**
 * Session entity with domain validation
 */
export class Session {
  private constructor(private readonly data: SessionData) {
    this.validate();
  }

  /**
   * Factory method to create a new session
   */
  static create(data: Omit<SessionData, 'createdAt' | 'lastActivity'>): Session {
    const now = Date.now();
    return new Session({
      ...data,
      createdAt: now,
      lastActivity: now,
    });
  }

  /**
   * Factory method to restore session from storage
   */
  static restore(data: SessionData): Session {
    return new Session(data);
  }

  /**
   * Validate session data according to domain rules
   */
  private validate(): void {
    if (!this.data.userId || this.data.userId.trim() === '') {
      throw new Error('Session must have a valid userId');
    }
    if (!this.data.email || !this.isValidEmail(this.data.email)) {
      throw new Error('Session must have a valid email');
    }
    if (!this.data.accessToken || this.data.accessToken.trim() === '') {
      throw new Error('Session must have a valid accessToken');
    }
    if (!this.data.expiresAt || this.data.expiresAt <= 0) {
      throw new Error('Session must have a valid expiresAt timestamp');
    }
    if (!['domain', 'service'].includes(this.data.userType)) {
      throw new Error('Session userType must be domain or service');
    }
  }

  /**
   * Check if session is expired
   */
  isExpired(now: number = Date.now()): boolean {
    return now > this.data.expiresAt;
  }

  /**
   * Check if session needs token refresh
   */
  needsRefresh(thresholdSeconds: number, now: number = Date.now()): boolean {
    const timeUntilExpiry = this.data.expiresAt - now;
    return timeUntilExpiry < thresholdSeconds * 1000;
  }

  /**
   * Update activity timestamp
   */
  updateActivity(now: number = Date.now()): Session {
    return new Session({
      ...this.data,
      lastActivity: now,
    });
  }

  /**
   * Get session data for serialization
   */
  toData(): SessionData {
    return { ...this.data };
  }

  /**
   * Validate email format (simple check)
   */
  private isValidEmail(email: string): boolean {
    // Simple email validation without catastrophic backtracking
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    const [local, domain] = parts;
    if (!local || !domain) {
      return false;
    }
    return domain.includes('.') && !email.includes(' ');
  }

  // Getters
  get userId(): string {
    return this.data.userId;
  }

  get email(): string {
    return this.data.email;
  }

  get accessToken(): string {
    return this.data.accessToken;
  }

  get refreshToken(): string {
    return this.data.refreshToken;
  }

  get expiresAt(): number {
    return this.data.expiresAt;
  }

  get userType(): 'domain' | 'service' {
    return this.data.userType;
  }

  get lastActivity(): number | undefined {
    return this.data.lastActivity;
  }

  get createdAt(): number | undefined {
    return this.data.createdAt;
  }
}
