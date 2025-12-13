# Platformatic Modular Monolith - Quick Reference

## Struttura Progetto

```
library-app/
├── watt.json                    # Config runtime (entrypoint)
├── package.json
└── web/
    ├── people-application/      # DB Service
    ├── books-application/       # DB Service
    ├── movies-application/      # DB Service
    └── media-application/       # Gateway (compone books + movies)
```

## Comandi Essenziali

```bash
# Crea progetto
npm create wattpm

# Avvia app
npm start

# Migrations
npx wattpm <app-name>:migrations:apply

# Seed database
npx wattpm <app-name>:seed seed.js

# Esporta schema OpenAPI
npx wattpm <app-name>:schema openapi > schema.json
```

## DB Application - Schema Migration

```sql
-- migrations/001.do.sql
CREATE TABLE IF NOT EXISTS <table> (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- migrations/001.undo.sql
DROP TABLE <table>;
```

## DB Application - Seed

```javascript
// seed.js
module.exports = async function ({ entities, logger }) {
  const item = await entities.<entity>.save({ input: { name: 'Example' } })
  logger.info({ item }, 'Created')
}
```

## Gateway - platformatic.json

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.0.0.json",
  "gateway": {
    "applications": [
      {
        "id": "books-application",
        "openapi": {
          "url": "/documentation/json",
          "config": "books-openapi.config.json"
        }
      }
    ],
    "refreshTimeout": 1000
  },
  "plugins": {
    "paths": ["./plugin.js"]
  }
}
```

## Gateway - Filtra Route (read-only)

```json
// <app>-openapi.config.json
{
  "paths": {
    "/<resource>/": {
      "post": { "ignore": true },
      "put": { "ignore": true },
      "delete": { "ignore": true }
    }
  }
}
```

## Gateway - Plugin con Client

```javascript
// plugin.js
const { buildOpenAPIClient } = require('massimo')
const { resolve } = require('node:path')

module.exports = async function (app) {
  const client = await buildOpenAPIClient({
    url: 'http://<app-name>.plt.local',
    path: resolve(__dirname, 'clients/<app>/<app>.openapi.json')
  })

  // Hook per modificare response
  app.platformatic.addGatewayOnRouteHook('/books/', ['GET'], (routeOptions) => {
    routeOptions.config.onGatewayResponse = async (request, reply, body) => {
      const data = await body.json()
      // modifica data
      reply.send(data)
    }
  })
}
```

## Genera Client

```bash
cd web/<gateway-app>
npm install massimo
mkdir -p clients/<app>
npx wattpm <app>:schema openapi > clients/<app>/<app>.openapi.json
npx massimo-cli --name <app> --folder clients/<app> clients/<app>/<app>.openapi.json
```

## watt.json - Entrypoint

```json
{
  "entrypoint": "<app-name>"
}
```

## Service Proxy (debug)

```json
{
  "id": "people-application",
  "proxy": { "prefix": "people-application" }
}
```

## URL Utili

- API Docs: `http://127.0.0.1:3042/documentation/`
- Internal service URL: `http://<app-name>.plt.local`
