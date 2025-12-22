/**
 * Identity Provider Port (Application Layer)
 *
 * Interface for authentication provider operations.
 * Implementations: Keycloak, Auth0, Cognito, Mock (test), etc.
 */

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  idToken?: string;
}

export interface UserInfo {
  sub: string; // User ID
  email: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
}

export interface IdentityProvider {
  /**
   * Validate and decode an access token
   */
  validateToken(token: string): Promise<UserInfo>;

  /**
   * Refresh an access token using refresh token
   */
  refreshToken(refreshToken: string): Promise<TokenResponse>;

  /**
   * Get user information from access token
   */
  getUserInfo(accessToken: string): Promise<UserInfo>;

  /**
   * Revoke a token (logout)
   */
  revokeToken(token: string): Promise<void>;
}
