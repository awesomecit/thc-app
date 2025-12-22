Keycloak Auth Module Integration in thc-app Extraction and adaptation of the Keycloak authentication
module from tech-citizen-sw-gateway to thc-app, following hexagonal architecture.

User Review Required IMPORTANT

Keycloak Configuration: You'll need to provide Keycloak realm/client configuration or confirm if we
should create a Docker Compose setup for local development.

IMPORTANT

Workspace Structure: The current thc-app uses web/_ workspaces. Proposed new location: packages/auth
. This requires adding "packages/_" to workspaces in root package.json .

Proposed Changes Package Structure Overview thc-app/ ├── packages/ [NEW DIRECTORY] │ └── auth/ [NEW
PACKAGE @thc/auth] │ ├── src/ │ │ ├── index.ts # Main plugin export │ │ ├── keycloak.ts # Keycloak
OIDC plugin │ │ ├── session-manager.ts # Session management with Redis │ │ ├── types.ts # Type
augmentation │ │ ├── plugins/ │ │ │ └── jwt.ts # JWT validation plugin │ │ ├── application/ │ │ │
└── ports/ │ │ │ ├── identity-provider.port.ts │ │ │ └── session-repository.port.ts │ │ ├──
infrastructure/ │ │ │ └── adapters/ │ │ │ ├── keycloak-identity.adapter.ts │ │ │ └──
redis-session.adapter.ts │ │ └── domain/ │ │ └── entities/ │ │ └── session.entity.ts │ ├──
package.json │ └── tsconfig.json ├── web/ │ └── thc-gateway/ │ ├── plugins/ │ │ └── auth.ts [NEW -
Auth plugin registration] │ └── watt.json [MODIFY - Add env vars] └── package.json [MODIFY - Add
packages workspace] Root Configuration [MODIFY] package.json Add packages/\* to workspaces array:

"workspaces": [

- "web/\*"

* "web/\*",
* "packages/\*" ] @thc/auth Package [NEW] package.json New package with Keycloak and session
  dependencies:

{ "name": "@thc/auth", "version": "0.1.0", "type": "module", "description": "Keycloak authentication
plugin for Fastify/Platformatic", "main": "dist/index.js", "types": "dist/index.d.ts", "exports": {
".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } }, "scripts": { "build": "tsc
--build", "clean": "rm -rf dist", "test": "node --test 'test/**/\*.test.ts'" }, "peerDependencies":
{ "fastify": "^5.0.0" }, "dependencies": { "@fastify/cookie": "^11.0.0", "@fastify/jwt": "^9.0.0",
"@fastify/oauth2": "^8.1.0", "@fastify/session": "^11.0.0", "@sinclair/typebox": "^0.33.0",
"fastify-plugin": "^5.0.0", "ioredis": "^5.4.0" }, "devDependencies": { "@types/node": "^22.0.0",
"typescript": "^5.5.0" } } [NEW] tsconfig.json { "compilerOptions": { "target": "ES2022", "module":
"NodeNext", "moduleResolution": "NodeNext", "declaration": true, "outDir": "./dist", "rootDir":
"./src", "strict": true, "esModuleInterop": true, "skipLibCheck": true }, "include": ["src/**/\*"],
"exclude": ["node_modules", "dist", "test"] } [NEW] index.ts Main entry point with two modes:

enableRoutes: true → Full Keycloak OIDC (for auth service) enableRoutes: false → JWT validation only
(for gateway) [NEW] keycloak.ts Keycloak OIDC plugin with:

OAuth2 flow via @fastify/oauth2 Session storage in Redis via @fastify/session Routes: /auth/login,
/auth/callback, /auth/logout PKCE support for security [NEW] plugins/jwt.ts JWT validation plugin:

RS256 algorithm Issuer validation (Keycloak realm URL) fastify.authenticate decorator [NEW]
session-manager.ts Session management with:

Sliding window TTL extension Auto-refresh of tokens before expiry Activity tracking Cleanup cron job
[NEW] Hexagonal Architecture Files File Purpose application/ports/identity-provider.port.ts
Interface for identity provider operations application/ports/session-repository.port.ts Interface
for session storage domain/entities/session.entity.ts Session data structure and factory functions
infrastructure/adapters/keycloak-identity.adapter.ts Keycloak API implementation
infrastructure/adapters/redis-session.adapter.ts Redis session storage implementation Gateway
Integration [NEW] auth.ts Register auth plugin in gateway with JWT-only mode:

import fp from 'fastify-plugin'; import authPlugin from '@thc/auth'; import type { FastifyInstance }
from 'fastify'; export default fp(async (fastify: FastifyInstance) => { await
fastify.register(authPlugin, { keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
realm: process.env.KEYCLOAK_REALM || 'thc', clientId: process.env.KEYCLOAK_CLIENT_ID ||
'thc-gateway', enableRoutes: false, // JWT validation only }); }, { name: 'auth' }); [MODIFY]
watt.json Add environment variable mappings.

[MODIFY] package.json Add @thc/auth dependency:

"dependencies": { "@fastify/sensible": "^6.0.4", "@platformatic/gateway": "^3.27.0",

- "@thc/auth": "\*", "prom-client": "^15.1.3" } Development Environment [NEW]
  docker-compose.keycloak.yml Docker Compose for local Keycloak development:

services: keycloak: image: quay.io/keycloak/keycloak:26.0 command: start-dev environment:
KEYCLOAK_ADMIN: admin KEYCLOAK_ADMIN_PASSWORD: admin ports: - "8080:8080" volumes: -
keycloak_data:/opt/keycloak/data redis: image: redis:7-alpine ports: - "6379:6379" volumes:
keycloak_data: [MODIFY] .env.example Add Keycloak configuration variables:

# Keycloak Configuration

KEYCLOAK_URL=http://localhost:8080 KEYCLOAK_REALM=thc KEYCLOAK_CLIENT_ID=thc-gateway
KEYCLOAK_CLIENT_SECRET= KEYCLOAK_CALLBACK_URL=http://localhost:3042/auth/callback

# Redis Configuration

REDIS_URL=redis://localhost:6379

# Session Configuration

SESSION_SECRET=your-32-char-minimum-secret-here Verification Plan Automated Tests Unit tests for
@thc/auth package:

cd packages/auth && npm test Integration test - Gateway starts with auth plugin:

npm run dev curl http://localhost:3042/health JWT validation test - Protected route returns 401
without token:

curl -I http://localhost:3042/api/protected

# Expected: 401 Unauthorized

Manual Verification Start Keycloak with Docker Compose:

docker compose -f docker-compose.keycloak.yml up -d Create realm and client in Keycloak Admin
Console (http://localhost:8080)

Test full OIDC flow:

Navigate to http://localhost:3042/auth/login Should redirect to Keycloak login page After login,
should redirect back to callback Session should be established in Redis
