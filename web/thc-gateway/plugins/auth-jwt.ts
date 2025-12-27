/**
 * JWT Validation Plugin for Gateway
 *
 * Registers @thc/auth in JWT-only mode (no OAuth2 routes).
 * Validates tokens issued by thc-auth-service or Keycloak.
 */

import type { FastifyPluginAsync } from 'fastify';
import authPlugin from '@thc/auth';

const authJwtPlugin: FastifyPluginAsync = async (app) => {
  const keycloakUrl = process.env.PLT_KEYCLOAK_URL ?? 'http://localhost:8081';
  const realm = process.env.PLT_KEYCLOAK_REALM ?? 'ticops';
  const clientId = process.env.PLT_KEYCLOAK_CLIENT_ID ?? 'thc-gateway';
  const jwtPublicKey = process.env.PLT_KEYCLOAK_PUBLIC_KEY;

  if (!jwtPublicKey) {
    app.log.warn('PLT_KEYCLOAK_PUBLIC_KEY not set - JWT validation may fail');
  }

  await app.register(authPlugin, {
    keycloakUrl,
    realm,
    clientId,
    jwtPublicKey,
    enableRoutes: false, // JWT validation only, no OAuth2 routes
  });

  app.log.info(
    {
      keycloakUrl,
      realm,
      clientId,
    },
    '🔐 JWT validation enabled'
  );
};

export default authJwtPlugin;
