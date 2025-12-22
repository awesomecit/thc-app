# @thc/auth - Keycloak Authentication Package

Modulo di autenticazione Keycloak per Platformatic Watt con architettura esagonale.

## 🏗️ Architettura

```
packages/auth/
├── src/
│   ├── domain/
│   │   └── entities/
│   │       └── session.entity.ts       # Entità Session (logica business)
│   ├── application/
│   │   └── ports/
│   │       ├── session-repository.port.ts      # Interfaccia storage
│   │       └── identity-provider.port.ts       # Interfaccia IdP
│   ├── infrastructure/
│   │   └── adapters/
│   │       ├── redis-session.adapter.ts        # Redis implementation
│   │       └── in-memory-session.adapter.ts    # Test fake
│   ├── index.ts           # Main plugin (JWT o Keycloak)
│   ├── jwt.ts             # JWT validation plugin
│   ├── keycloak.ts        # Keycloak OIDC plugin
│   └── session.ts         # Session manager
└── test/
    ├── unit/
    │   ├── session.entity.test.ts          # 34 test
    │   ├── session-repository.test.ts      # 16 test
    │   └── jwt.test.ts                     # 8 test
    └── helpers/
        └── test-keys.ts                     # RSA keypair per test
```

## ✅ Stato Implementazione

### Completato (TDD)

- ✅ **Domain Layer**: Session entity con validazione completa
- ✅ **Ports**: SessionRepository, IdentityProvider interfaces
- ✅ **Adapters**: Redis + InMemory implementations
- ✅ **JWT Plugin**: Validazione token RS256
- ✅ **62 test unitari** con `node:test` (native Node.js)
- ✅ **Coverage**: Domain 100%, Adapters 100%, JWT 97.72%

### Da completare

- ⏳ **Keycloak plugin**: Test integrazione (richiede Keycloak mock/container)
- ⏳ **Session manager**: Test integrazione con Redis
- ⏳ **Gateway integration**: Plugin per thc-gateway

## 🧪 Test

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# Build
npm run build
```

### Coverage Attuale

```
Domain entities:       100%
Infrastructure:        100%
JWT plugin:            97.72%
Overall:               43.86% (keycloak.ts, session.ts non testati)
```

## 📦 Utilizzo

### Modalità Gateway (JWT validation only)

```typescript
import authPlugin from '@thc/auth';

await fastify.register(authPlugin, {
  keycloakUrl: 'http://localhost:8080',
  realm: 'thc',
  clientId: 'thc-gateway',
  enableRoutes: false, // Solo validazione JWT
  jwtPublicKey: process.env.JWT_PUBLIC_KEY,
});

// Protected route
fastify.get('/api/data', {
  preHandler: fastify.authenticate,
  handler: async () => ({ data: 'secret' }),
});
```

### Modalità Auth API (Full OIDC)

```typescript
await fastify.register(authPlugin, {
  keycloakUrl: 'http://localhost:8080',
  realm: 'thc',
  clientId: 'auth-api',
  clientSecret: process.env.CLIENT_SECRET,
  enableRoutes: true, // Attiva /auth/login, /auth/callback, /auth/logout
  redisUrl: process.env.REDIS_URL,
});
```

## 🔑 Environment Variables

```env
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=thc
KEYCLOAK_CLIENT_ID=thc-gateway
KEYCLOAK_CLIENT_SECRET=
JWT_PUBLIC_KEY=
REDIS_URL=redis://localhost:6379
SESSION_SECRET=min-32-chars-secret
```

## 🧩 Dipendenze

- `@fastify/jwt` - JWT validation
- `@fastify/oauth2` - OIDC flow
- `@fastify/session` - Session management
- `@fastify/cookie` - Cookie handling
- `ioredis` - Redis client
- `fastify-plugin` - Plugin wrapper

## 📚 Principi Applicati

- **Hexagonal Architecture**: Domain isolato da infrastruttura
- **Ports & Adapters**: Interfacce per dipendenze esterne
- **TDD**: Test-first development (Red-Green-Refactor)
- **SOLID**: SRP, OCP, DIP
- **Regola Zero**: Ogni componente deve giustificare la sua esistenza

## 🚀 Prossimi Step

1. Test integrazione Keycloak (con Testcontainers o mock)
2. Test integrazione SessionManager con Redis
3. Integrazione in `web/thc-gateway/plugins/auth.ts`
4. Docker Compose con Keycloak per development
5. Documentazione JWT token format e claims
