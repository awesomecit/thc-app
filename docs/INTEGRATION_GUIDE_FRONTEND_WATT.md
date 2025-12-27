# Guida Integrazione Frontend in Platformatic Watt

## Contesto del Progetto

Questo documento guida l'integrazione dell'applicazione frontend **tactical-hub** (Vue 3 + Vite) nel
progetto **THC (TicOps Health Check)** basato su Platformatic Watt. L'obiettivo è che Watt orchestri
il frontend insieme ai servizi backend esistenti, gestendo automaticamente routing, build e
comunicazione inter-service.

### Architettura Attuale THC

```
thc-project/
├── watt.json                    # Root: orchestrazione runtime
├── .env                         # Variabili condivise
└── web/
    ├── thc-gateway/             # Gateway (entrypoint pubblico)
    │   └── platformatic.json
    ├── thc-db/                  # Platformatic DB
    ├── thc-service/             # Business logic (Fastify)
    └── thc-node/                # Node.js apps
```

### Target Finale

```
thc-project/
└── web/
    ├── thc-gateway/             # Gateway aggiornato
    ├── thc-db/
    ├── thc-service/
    ├── thc-node/
    └── thc-frontend/            # ← NUOVA: tactical-hub Vue app
        ├── watt.json
        ├── vite.config.ts
        ├── package.json
        └── src/
```

---

## Best Practice Ufficiali Platformatic (Dicembre 2025)

Queste best practice derivano dalla documentazione ufficiale Platformatic e dal blog di rilascio di
Watt 3.x.

### 1. Usare @platformatic/vite per SPA Standard

Per applicazioni Vue/React/Svelte basate su Vite, il package `@platformatic/vite` è la scelta
raccomandata. Offre integrazione zero-config con:

- **Development**: Vite dev server in worker thread con HMR completo
- **Production**: Fastify server ottimizzato per asset statici

### 2. Schema JSON Corretto per Watt 3.x

Gli schema URL sono cambiati in Watt 3.x. Usa sempre:

- `@platformatic/vite/3.0.0.json` per Vite apps
- `@platformatic/gateway/3.0.0.json` per il gateway (rinominato da "composer")
- `@platformatic/runtime/3.0.0.json` per il root watt.json

### 3. Configurazione Sicurezza Obbligatoria

A causa di CVE-2025-24010, tutte le app Vite devono configurare gli host consentiti:

```javascript
// vite.config.ts - OBBLIGATORIO
export default defineConfig({
  server: {
    allowedHosts: ['.plt.local'],
  },
});
```

### 4. Comunicazione Inter-Service

Le applicazioni comunicano internamente via mesh network `.plt.local`:

- `http://thc-db.plt.local` → database service
- `http://thc-service.plt.local` → business logic
- Questi hostname risolvono SOLO dentro Watt runtime

### 5. Gateway come Unico Entrypoint

Il Gateway è l'unico punto di accesso pubblico. Configura:

- Route specifiche prima (`/api/*`)
- Catch-all frontend alla fine (`/`)

---

## Passi di Integrazione

### PASSO 1: Creare la Directory e Copiare i File

```bash
# Dalla root del progetto THC
mkdir -p web/thc-frontend

# Copia i file del frontend tactical-hub
# NOTA: Adatta il path sorgente alla tua situazione
cp -r /path/to/tactical-hub/src web/thc-frontend/
cp -r /path/to/tactical-hub/public web/thc-frontend/
cp /path/to/tactical-hub/package.json web/thc-frontend/
cp /path/to/tactical-hub/vite.config.* web/thc-frontend/
cp /path/to/tactical-hub/tsconfig.* web/thc-frontend/
cp /path/to/tactical-hub/index.html web/thc-frontend/
```

### PASSO 2: Creare watt.json per il Frontend

Crea il file `web/thc-frontend/watt.json`:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/vite/3.0.0.json",
  "application": {
    "basePath": "/"
  }
}
```

**Note importanti:**

- `basePath: "/"` indica che il frontend sarà servito alla root
- Non specificare porte: Watt le gestisce automaticamente
- Lo schema `@platformatic/vite` abilita l'integrazione automatica

### PASSO 3: Aggiornare vite.config.ts

Modifica `web/thc-frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],

  // OBBLIGATORIO: Sicurezza per mesh network Watt
  server: {
    allowedHosts: ['.plt.local'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Build ottimizzato per produzione
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
});
```

### PASSO 4: Configurare le Chiamate API nel Frontend

Il frontend deve chiamare le API attraverso il gateway. Crea o aggiorna il file di configurazione
API:

```typescript
// web/thc-frontend/src/config/api.ts

// In produzione, le chiamate passano attraverso il gateway Watt
// In development standalone, puoi usare il proxy di Vite
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiConfig = {
  baseUrl: API_BASE,

  endpoints: {
    // Platformatic DB endpoints
    db: {
      base: `${API_BASE}/db`,
      health: `${API_BASE}/db/health`,
    },

    // Business logic service endpoints
    service: {
      base: `${API_BASE}`,
      operations: `${API_BASE}/operations`,
    },
  },
};

// Helper per fetch con error handling
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

### PASSO 5: Aggiornare il Gateway

Modifica `web/thc-gateway/platformatic.json` per includere il routing frontend:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/gateway/3.0.0.json",
  "gateway": {
    "applications": [
      {
        "id": "thc-db",
        "proxy": {
          "prefix": "/api/db"
        }
      },
      {
        "id": "thc-service",
        "proxy": {
          "prefix": "/api"
        }
      },
      {
        "id": "thc-frontend",
        "proxy": {
          "prefix": "/"
        }
      }
    ],
    "refreshTimeout": 1000
  },
  "watch": true
}
```

**IMPORTANTE:** L'ordine delle applicazioni conta!

1. Route più specifiche prima (`/api/db`, `/api`)
2. Catch-all frontend alla fine (`/`)

### PASSO 6: Verificare il Root watt.json

Il root `watt.json` dovrebbe già usare `autoload`, quindi thc-frontend sarà scoperto
automaticamente. Verifica che sia così:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/watt/3.27.0.json",
  "entrypoint": "thc-gateway",
  "autoload": {
    "path": "web",
    "exclude": ["docs"]
  },
  "server": {
    "hostname": "0.0.0.0",
    "port": "{PLT_SERVER_PORT}"
  }
}
```

Se non usa autoload, aggiungi manualmente:

```json
{
  "web": [
    { "id": "thc-gateway", "path": "web/thc-gateway" },
    { "id": "thc-db", "path": "web/thc-db" },
    { "id": "thc-service", "path": "web/thc-service" },
    { "id": "thc-node", "path": "web/thc-node" },
    { "id": "thc-frontend", "path": "web/thc-frontend" }
  ]
}
```

### PASSO 7: Aggiornare package.json del Frontend

Verifica che `web/thc-frontend/package.json` abbia gli script corretti:

```json
{
  "name": "thc-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "type-check": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}
```

### PASSO 8: Installare Dipendenze

```bash
# Dalla directory del frontend
cd web/thc-frontend
npm install

# Oppure dalla root con workspaces
cd ../..
npm install
```

### PASSO 9: Configurare Vue Router per History Mode

Se usi Vue Router, assicurati che sia in history mode per funzionare correttamente con il gateway:

```typescript
// web/thc-frontend/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  // History mode: URL puliti senza hash
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    // Catch-all per 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
});

export default router;
```

---

## Verifica dell'Integrazione

### Test 1: Avvio in Development

```bash
# Dalla root del progetto
npm run dev
# oppure
wattpm dev
```

Verifica:

- [ ] Il gateway risponde su `http://localhost:3042`
- [ ] Il frontend è accessibile su `http://localhost:3042/`
- [ ] Le API sono accessibili su `http://localhost:3042/api/*`
- [ ] HMR funziona (modifica un file Vue e verifica il reload)

### Test 2: Build di Produzione

```bash
# Build completa
wattpm build

# Avvio produzione
wattpm start
```

Verifica:

- [ ] Build completa senza errori
- [ ] Frontend servito correttamente
- [ ] Asset statici (CSS, JS, immagini) caricati
- [ ] Routing client-side funziona (naviga e ricarica la pagina)

### Test 3: Comunicazione API

```bash
# Test endpoint DB
curl http://localhost:3042/api/db/health

# Test endpoint Service
curl http://localhost:3042/api/health
```

Dal frontend, verifica che le chiamate fetch funzionino correttamente.

---

## Troubleshooting

### Errore: "Host not allowed"

**Causa**: Manca la configurazione `allowedHosts` in vite.config.ts

**Soluzione**:

```typescript
server: {
  allowedHosts: ['.plt.local'];
}
```

### Errore: 404 su Refresh di Route Client-Side

**Causa**: Il server non gestisce correttamente il fallback SPA

**Soluzione**: Platformatic Vite gestisce automaticamente il fallback. Se persiste, verifica che:

1. Vue Router usi `createWebHistory()` (non hash mode)
2. Il `basePath` nel watt.json sia corretto

### Errore: CORS sulle Chiamate API

**Causa**: Chiamate dirette ai servizi invece che attraverso il gateway

**Soluzione**: Tutte le chiamate API devono passare dal gateway:

```typescript
// SBAGLIATO
fetch('http://thc-service.plt.local/operations');

// CORRETTO (dal browser)
fetch('/api/operations');
```

### Errore: Applicazione Non Trovata

**Causa**: L'ID nel gateway non corrisponde al nome della directory

**Soluzione**: L'ID dell'applicazione deriva dal nome della cartella. Se la cartella è
`thc-frontend`, l'ID sarà `thc-frontend`. Verifica la corrispondenza nel `platformatic.json` del
gateway.

### Errore: Porta Già in Uso

**Causa**: Altra istanza di Watt in esecuzione

**Soluzione**:

```bash
# Trova e termina il processo
lsof -i :3042
kill -9 <PID>

# Oppure usa una porta diversa in .env
PLT_SERVER_PORT=3043
```

---

## Checklist Finale

Prima di considerare l'integrazione completata, verifica:

- [ ] `web/thc-frontend/watt.json` creato con schema corretto
- [ ] `vite.config.ts` ha `allowedHosts: [".plt.local"]`
- [ ] `web/thc-gateway/platformatic.json` aggiornato con route frontend
- [ ] Route frontend (`/`) è ULTIMA nella lista del gateway
- [ ] `npm install` eseguito in `web/thc-frontend`
- [ ] `wattpm dev` avvia senza errori
- [ ] Frontend accessibile su `http://localhost:3042/`
- [ ] API accessibili su `http://localhost:3042/api/*`
- [ ] `wattpm build` completa senza errori
- [ ] `wattpm start` serve correttamente in produzione

---

## Riferimenti

- [Platformatic Vite Overview](https://docs.platformatic.dev/docs/packages/vite/overview)
- [Platformatic Gateway Configuration](https://docs.platformatic.dev/docs/reference/gateway/overview)
- [Watt 3.x Release Notes](https://blog.platformatic.dev/introducing-watt-3)
- [Multi-App Example: composer-next-node-fastify](https://github.com/platformatic/composer-next-node-fastify)
