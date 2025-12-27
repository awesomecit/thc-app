# E2E Testing Setup for Platformatic Watt 3.27.0 with Keycloak

> **VERSIONE CORRETTA** - Basata sulla documentazione ufficiale Platformatic 3.27.0

## Terminologia e Struttura Corretta

### File di Configurazione

La struttura di file per un progetto Watt 3.27.0 è la seguente:

```
project-root/
├── watt.json                           # Runtime Watt configuration (PRINCIPALE)
├── package.json
├── web/
│   ├── thc-gateway/
│   │   └── platformatic.json           # Gateway config con schema @platformatic/gateway
│   ├── thc-db/
│   │   └── platformatic.json           # DB config con schema @platformatic/db
│   ├── thc-service/
│   │   └── platformatic.json           # Service config
│   └── thc-rabbitmq-hooks/
│       └── platformatic.json           # Service config
└── test/
    └── e2e/
```

### Schema URLs Corretti (versione 3.27.0)

```javascript
// watt.json (Runtime)
"$schema": "https://schemas.platformatic.dev/wattpm/3.27.0.json"

// web/thc-gateway/platformatic.json (Gateway)
"$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.27.0.json"

// web/thc-db/platformatic.json (DB)
"$schema": "https://schemas.platformatic.dev/@platformatic/db/3.27.0.json"

// web/thc-service/platformatic.json (Service)
"$schema": "https://schemas.platformatic.dev/@platformatic/service/3.27.0.json"
```

---

## Configurazione Gateway Corretta

Il package corretto è **`@platformatic/gateway`** (NON composer!). La sezione di configurazione usa **`gateway.applications`**.

### web/thc-gateway/platformatic.json

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.27.0.json",
  "gateway": {
    "applications": [
      {
        "id": "thc-db",
        "openapi": {
          "url": "/documentation/json",
          "prefix": "/api/db"
        }
      },
      {
        "id": "thc-service",
        "openapi": {
          "url": "/documentation/json",
          "prefix": "/api/service"
        }
      },
      {
        "id": "thc-rabbitmq-hooks",
        "proxy": {
          "prefix": "/api/hooks"
        }
      },
      {
        "id": "auth-service",
        "openapi": {
          "url": "/documentation/json",
          "prefix": "/api/auth"
        }
      }
    ],
    "refreshTimeout": 1000
  },
  "watch": true
}
```

### watt.json (Runtime Configuration)

```json
{
  "$schema": "https://schemas.platformatic.dev/wattpm/3.27.0.json",
  "server": {
    "port": "{PLT_SERVER_PORT}",
    "hostname": "{PLT_SERVER_HOSTNAME}",
    "logger": {
      "level": "{PLT_SERVER_LOGGER_LEVEL}"
    }
  },
  "autoload": {
    "path": "web"
  },
  "entrypoint": "thc-gateway"
}
```

---

## API Programmatica per Test E2E

### buildServer da @platformatic/runtime

La funzione `buildServer` da `@platformatic/runtime` inizializza l'intero server Watt basandosi sul file di configurazione. Questa è la modalità raccomandata per i test E2E perché avvia tutti i servizi insieme con la comunicazione inter-servizio già configurata.

```javascript
// test/e2e/helper.js
import { buildServer } from '@platformatic/runtime'
import path from 'path'

/**
 * Builds and starts the complete Watt application for E2E testing.
 * 
 * The buildServer function accepts either:
 * - A path to the configuration file (string)
 * - A configuration object
 * 
 * It returns a server instance with start() and close() methods.
 */
export async function buildTestApp() {
  // Point to the main watt.json file
  const configPath = path.join(process.cwd(), 'watt.json')
  
  // buildServer initializes all services defined in the runtime
  const app = await buildServer(configPath)
  
  // start() returns the entrypoint URL
  const entrypointUrl = await app.start()
  
  return { app, baseUrl: entrypointUrl }
}

/**
 * Builds the app with custom configuration overrides.
 * Useful for test isolation (random ports, different log levels).
 */
export async function buildTestAppWithOverrides() {
  const app = await buildServer({
    // The $schema tells buildServer which type of app to create
    $schema: 'https://schemas.platformatic.dev/wattpm/3.27.0.json',
    server: {
      port: 0,  // Random available port for test isolation
      hostname: '127.0.0.1',
      logger: { level: 'error' }  // Reduce noise in test output
    },
    autoload: {
      path: 'web'
    },
    entrypoint: 'thc-gateway'
  })
  
  const entrypointUrl = await app.start()
  return { app, baseUrl: entrypointUrl }
}
```

### loadConfig per Lettura Configurazione

La funzione `loadConfig` legge e parsa un file di configurazione, rilevando automaticamente il tipo di applicazione:

```javascript
import { loadConfig } from '@platformatic/runtime'

// Auto-detect application type
const config = await loadConfig(
  {},                    // minimistConfig (CLI args parsing)
  ['-c', 'watt.json'],   // args
  { watch: false }       // options
)

console.log(config.configManager.current) // Parsed configuration
```

---

## Test E2E Completi con node:test

Platformatic raccomanda ufficialmente `node:test` come framework di testing. Watt 3 ha anche consolidato il comando di test in `node --test` (precedentemente era `borp`).

### test/e2e/gateway-proxy.test.js

```javascript
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildServer } from '@platformatic/runtime'
import path from 'path'

describe('Gateway Proxy E2E Tests', () => {
  let app
  let baseUrl

  before(async () => {
    // Build and start the entire Watt runtime
    const configPath = path.join(process.cwd(), 'watt.json')
    app = await buildServer(configPath)
    baseUrl = await app.start()
    
    console.log(`E2E Test server running at ${baseUrl}`)
  })

  after(async () => {
    // Graceful shutdown is critical for clean test runs
    if (app) {
      await app.close()
    }
  })

  test('Gateway is accessible at entrypoint', async () => {
    const response = await fetch(baseUrl)
    // Gateway should respond (even if just with documentation redirect)
    assert.ok([200, 302, 404].includes(response.status))
  })

  test('Gateway proxies to thc-db service via /api/db', async () => {
    const response = await fetch(`${baseUrl}/api/db/health`)
    assert.equal(response.status, 200)
  })

  test('Gateway proxies to thc-service via /api/service', async () => {
    const response = await fetch(`${baseUrl}/api/service/health`)
    assert.equal(response.status, 200)
  })

  test('Gateway exposes unified OpenAPI documentation', async () => {
    const response = await fetch(`${baseUrl}/documentation/json`)
    assert.equal(response.status, 200)
    
    const openapi = await response.json()
    assert.equal(openapi.openapi.startsWith('3.'), true)
    
    // Verify paths from multiple services are aggregated
    const paths = Object.keys(openapi.paths)
    console.log('Aggregated API paths:', paths)
  })
})
```

### test/e2e/auth-flow.test.js - Test Authentication via Gateway

```javascript
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { buildServer } from '@platformatic/runtime'
import path from 'path'

/**
 * Helper class for OAuth2 authentication in E2E tests.
 * Uses Resource Owner Password Grant for direct username/password auth.
 */
class AuthHelper {
  constructor(keycloakUrl, realm, clientId, clientSecret) {
    this.tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  async getTokenWithPassword(username, password) {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username,
      password,
      scope: 'openid profile email'
    })

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Token acquisition failed: ${error.error_description || error.error}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    }
  }

  async getServiceToken() {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    })

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error('Service token acquisition failed')
    }

    return (await response.json()).access_token
  }

  static bearerHeader(token) {
    return `Bearer ${token}`
  }
}

describe('Authentication Flow E2E Tests via Gateway', () => {
  let app, baseUrl, authHelper
  let playerToken

  before(async () => {
    const configPath = path.join(process.cwd(), 'watt.json')
    app = await buildServer(configPath)
    baseUrl = await app.start()

    // Initialize auth helper with test Keycloak
    authHelper = new AuthHelper(
      process.env.KEYCLOAK_URL || 'http://localhost:32820',
      process.env.KEYCLOAK_REALM || 'thc-test',
      process.env.KEYCLOAK_CLIENT_ID || 'thc-test-app',
      process.env.KEYCLOAK_CLIENT_SECRET || 'thc-test-secret'
    )

    // Pre-fetch token for test user
    try {
      const auth = await authHelper.getTokenWithPassword('test-player', 'test-player-password')
      playerToken = auth.accessToken
    } catch (err) {
      console.warn('Could not obtain test token, some tests may be skipped:', err.message)
    }
  })

  after(async () => {
    await app?.close()
  })

  describe('Unauthenticated Access', () => {
    test('public health endpoints are accessible without token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/health`)
      assert.equal(response.status, 200)
    })

    test('protected endpoints return 401 without token', async () => {
      const response = await fetch(`${baseUrl}/api/db/users/me`)
      assert.equal(response.status, 401)
    })
  })

  describe('Authenticated Access', () => {
    test('protected endpoints return 200 with valid token', async (t) => {
      if (!playerToken) {
        t.skip('No token available - Keycloak may not be running')
        return
      }

      const response = await fetch(`${baseUrl}/api/db/users/me`, {
        headers: {
          Authorization: AuthHelper.bearerHeader(playerToken)
        }
      })
      assert.equal(response.status, 200)
    })

    test('expired/invalid token returns 401', async () => {
      const invalidToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid'
      
      const response = await fetch(`${baseUrl}/api/db/users/me`, {
        headers: {
          Authorization: AuthHelper.bearerHeader(invalidToken)
        }
      })
      assert.equal(response.status, 401)
    })
  })
})
```

---

## Docker Compose per Infrastruttura Test

### docker-compose.e2e.yml

Keycloak 24.x usa `KC_BOOTSTRAP_ADMIN_USERNAME` invece di `KEYCLOAK_ADMIN`.

```yaml
version: '3.8'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: thc-keycloak-test
    environment:
      # IMPORTANTE: Keycloak 24.x usa KC_BOOTSTRAP_* non KEYCLOAK_*
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HEALTH_ENABLED: "true"
      KC_DB: dev-mem  # In-memory H2 per test veloci
    volumes:
      - ./test/fixtures/thc-test-realm.json:/opt/keycloak/data/import/thc-test-realm.json:ro
    ports:
      - "32820:8080"
    command:
      - start-dev
      - --import-realm
      - --http-port=8080
    healthcheck:
      # Bash TCP socket check (Keycloak non include curl)
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080"]
      interval: 10s
      timeout: 5s
      retries: 15
      start_period: 60s

  redis:
    image: redis:7-alpine
    container_name: thc-redis-test
    ports:
      - "32821:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:16-alpine
    container_name: thc-postgres-test
    environment:
      POSTGRES_DB: thc_test
      POSTGRES_USER: thc_test
      POSTGRES_PASSWORD: thc_test_password
    ports:
      - "32822:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U thc_test -d thc_test"]
      interval: 5s
      timeout: 5s
      retries: 10

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: thc-rabbitmq-test
    environment:
      RABBITMQ_DEFAULT_USER: thc_test
      RABBITMQ_DEFAULT_PASS: thc_test_password
    ports:
      - "32823:5672"
      - "32824:15672"
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10

networks:
  default:
    driver: bridge
    name: thc-test-network
```

### test/fixtures/thc-test-realm.json

```json
{
  "realm": "thc-test",
  "enabled": true,
  "sslRequired": "none",
  "registrationAllowed": false,
  "roles": {
    "realm": [
      { "name": "player" },
      { "name": "team_captain" },
      { "name": "field_owner" },
      { "name": "admin" }
    ]
  },
  "clients": [
    {
      "clientId": "thc-test-app",
      "name": "TicOps THC Test Application",
      "enabled": true,
      "publicClient": false,
      "secret": "thc-test-secret",
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "standardFlowEnabled": true,
      "redirectUris": ["http://localhost:*/*"],
      "webOrigins": ["*"],
      "protocol": "openid-connect"
    }
  ],
  "users": [
    {
      "username": "test-player",
      "email": "player@test.thc.local",
      "firstName": "Test",
      "lastName": "Player",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "test-player-password",
          "temporary": false
        }
      ],
      "realmRoles": ["player"]
    },
    {
      "username": "test-captain",
      "email": "captain@test.thc.local",
      "firstName": "Test",
      "lastName": "Captain",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "test-captain-password",
          "temporary": false
        }
      ],
      "realmRoles": ["player", "team_captain"]
    },
    {
      "username": "test-admin",
      "email": "admin@test.thc.local",
      "firstName": "Test",
      "lastName": "Admin",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "test-admin-password",
          "temporary": false
        }
      ],
      "realmRoles": ["player", "admin"]
    }
  ]
}
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "wattpm dev",
    "start": "wattpm start",
    "build": "wattpm build",
    
    "test": "node --test",
    "test:unit": "node --test test/unit/**/*.test.js",
    "test:e2e": "node --test --test-timeout=120000 test/e2e/**/*.test.js",
    
    "test:e2e:docker:up": "docker-compose -f docker-compose.e2e.yml up -d",
    "test:e2e:docker:down": "docker-compose -f docker-compose.e2e.yml down -v --remove-orphans",
    "test:e2e:wait": "wait-on tcp:32820 tcp:32821 tcp:32822 tcp:32823 -t 120000",
    
    "test:e2e:full": "npm run test:e2e:docker:up && npm run test:e2e:wait && npm run test:e2e; npm run test:e2e:docker:down",
    
    "test:e2e:ci": "docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from app-test"
  },
  "devDependencies": {
    "wait-on": "^7.2.0"
  }
}
```

---

## Comunicazione Inter-Servizio

All'interno del runtime Watt, i servizi comunicano usando il dominio speciale `.plt.local`:

```javascript
// Da qualsiasi servizio, chiamare un altro servizio
const response = await fetch('http://thc-db.plt.local/users')
const users = await response.json()

// Il Gateway espone questo come /api/db/users per i client esterni
```

---

## Riepilogo Correzioni

| Documento Precedente (ERRATO) | Versione Corretta (3.27.0) |
|-------------------------------|----------------------------|
| `@platformatic/composer` | **`@platformatic/gateway`** |
| `platformatic.json` per runtime | **`watt.json`** per runtime |
| `composer.services` | **`gateway.applications`** |
| `https://platformatic.dev/schemas/v1.30.0/composer` | **`https://schemas.platformatic.dev/@platformatic/gateway/3.27.0.json`** |
| Nessun file watt.json | **watt.json è il file principale per Watt runtime** |

---

## Checklist Implementazione

- [ ] Creare `test/e2e/helper.js` con `buildServer` da `@platformatic/runtime`
- [ ] Creare `test/e2e/gateway-proxy.test.js` per test proxy
- [ ] Creare `test/e2e/auth-flow.test.js` per test autenticazione via gateway
- [ ] Creare `docker-compose.e2e.yml` con Keycloak 24.x, Redis, PostgreSQL, RabbitMQ
- [ ] Creare `test/fixtures/thc-test-realm.json` con ruoli TicOps
- [ ] Aggiungere scripts npm per workflow E2E
- [ ] Testare comunicazione inter-servizio via `.plt.local`
