# TicOps THC - Roadmap XP Full-Stack

> Sprint settimanali con deliverable BE + FE + DevOps. Riferimenti: `docs/GANTT_TIMELINE.md`,
> `docs/FEATURES_ROADMAP.md`, `docs/MULTI_ORG_ARCHITECTURE.md`

**Stato Attuale**:

- ✅ Server + Dominio + Pagina Maintenance
- ✅ Frontend MVP 85% completo (mock-first)
- ❌ Backend reale non implementato
- ❌ CI/CD non configurato

**Obiettivo**: Sostituire mock con backend reale, deploy in produzione.

---

## Stato Attuale vs Target

| Layer        | Attuale                     | Target Sprint 8              |
| ------------ | --------------------------- | ---------------------------- |
| **Frontend** | 85% MVP con mock            | 100% connesso a backend      |
| **Backend**  | Nessuno                     | Platformatic + Prisma + Auth |
| **Database** | Nessuno                     | PostgreSQL + Redis           |
| **DevOps**   | Server + dominio            | CI/CD + Docker + Monitoring  |
| **Auth**     | Mock (`src/mocks/users.ts`) | Keycloak/JWT reale           |

---

## Sprint Overview

```
FASE 1: Infrastructure (Sprint 1-2)
├── S1: DevOps base + DB + Health
└── S2: Auth reale end-to-end

FASE 2: Core Backend (Sprint 3-4)
├── S3: Multi-org entities + Lookups
└── S4: Users, Teams, Fields API

FASE 3: Integration (Sprint 5-6)
├── S5: FE → BE integration (swap mock)
└── S6: Matches, Gameplay API

FASE 4: Production (Sprint 7-8)
├── S7: Membership, Payments, Notifiche
└── S8: Testing, Performance, Go-Live
```

---

## SPRINT 1: Infrastructure Bootstrap

**Durata**: 1 settimana | **Focus**: DevOps 60%, BE 30%, FE 10%

### DevOps (3 giorni)

**Giorno 1-2: Docker + CI/CD**

```yaml
# Deliverable: docker-compose.yml funzionante
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: thc
      POSTGRES_USER: thc
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  # Keycloak per auth (Sprint 2)
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KC_PASSWORD}
    command: start-dev
    ports:
      - '8080:8080'
```

```yaml
# Deliverable: .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: thc_test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Giorno 3: Deploy pipeline staging**

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/thc
            git pull origin develop
            docker-compose up -d --build
```

### Backend (2 giorni)

**Giorno 4: Platformatic Watt setup**

```
thc-project/
├── watt.json
├── package.json
├── .env
├── docker-compose.yml
├── prisma/
│   └── schema.prisma          # → Vedi PRISMA_ENTITY_SCHEMA.md
└── web/
    ├── thc-db/
    │   ├── platformatic.json
    │   └── plugins/
    ├── thc-service/
    │   └── platformatic.json
    └── thc-gateway/
        └── platformatic.json
```

```bash
# Setup commands
npm create platformatic@latest  # Scegli "Watt"
cd thc-project
npm install prisma @prisma/client @ruheni/db-diff --save-dev
npx prisma init
```

**Giorno 5: Prima migrazione + Health check**

```prisma
// prisma/schema.prisma - Solo foundation
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tabella di sistema Postgrator
model versions {
  version BigInt    @id
  name    String?
  md5     String?
  run_at  DateTime? @db.Timestamptz(6)
  @@ignore
}
```

```typescript
// web/thc-gateway/plugins/health.ts
export default async function (app) {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      db: await checkDb(),
      redis: await checkRedis(),
    },
  }));
}
```

### Frontend (0.5 giorni)

**Aggiornare pagina maintenance → "Coming Soon" con health check**

```typescript
// src/components/HealthStatus.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const status = ref<'checking' | 'online' | 'offline'>('checking')

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/health`)
    status.value = res.ok ? 'online' : 'offline'
  } catch {
    status.value = 'offline'
  }
})
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      class="w-3 h-3 rounded-full"
      :class="{
        'bg-green-500': status === 'online',
        'bg-red-500': status === 'offline',
        'bg-yellow-500 animate-pulse': status === 'checking'
      }"
    />
    <span>Backend: {{ status }}</span>
  </div>
</template>
```

### Definition of Done Sprint 1

- [ ] `docker-compose up` avvia PostgreSQL + Redis + Keycloak
- [ ] `npm run dev` avvia Platformatic Watt
- [ ] `GET /health` risponde con status services
- [ ] GitHub Actions CI passa
- [ ] Deploy staging automatico su push develop
- [ ] Frontend mostra status backend

---

## SPRINT 2: Authentication End-to-End

**Durata**: 1 settimana | **Focus**: BE 50%, FE 40%, DevOps 10%

### Backend (2.5 giorni)

**Giorno 1: Schema auth + prima migrazione**

Riferimento: `PRISMA_ENTITY_SCHEMA.md` sezione "Identity Context"

```prisma
// Aggiungi a schema.prisma
model User {
  id             String     @id @default(uuid()) @db.Uuid
  email          String     @unique @db.VarChar(255)
  username       String     @unique @db.VarChar(50)
  // ... resto da PRISMA_ENTITY_SCHEMA.md

  @@map("users")
}

model UserProfile { /* ... */ @@map("user_profiles") }
model UserSettings { /* ... */ @@map("user_settings") }
```

```bash
npx db-diff
npx platformatic db migrations apply
npx prisma generate
```

**Giorno 2: Plugin JWT validation**

Riferimento: `packages/auth/README.md` (se esiste), altrimenti:

```typescript
// web/thc-gateway/plugins/auth.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (app) => {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: '7d' },
  });

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
});
```

**Giorno 3: Endpoints auth**

```typescript
// web/thc-service/routes/auth.ts
export default async function (app) {
  // POST /auth/register
  app.post('/auth/register', async (request, reply) => {
    const { email, username, password } = request.body;
    // Hash password, create user, return token
  });

  // POST /auth/login
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body;
    // Verify credentials, return token
  });

  // GET /auth/me (protected)
  app.get(
    '/auth/me',
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return request.user;
    }
  );
}
```

### Frontend (2 giorni)

**Giorno 4: Sostituire mock auth con reale**

Riferimento: `src/stores/authStore.ts` esistente, `src/api/` esistente

```typescript
// src/api/auth.ts - Nuovo client reale
import { setBaseUrl, setDefaultHeaders } from './thc-api';

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error('Login failed');

  const { token, user } = await res.json();

  // Configura client generato per richieste autenticate
  setDefaultHeaders({ Authorization: `Bearer ${token}` });
  localStorage.setItem('token', token);

  return user;
}

export async function logout() {
  localStorage.removeItem('token');
  setDefaultHeaders({});
}
```

**Giorno 5: Aggiornare authStore + test login flow**

```typescript
// src/stores/authStore.ts - Aggiornare per usare API reale
import { defineStore } from 'pinia';
import * as authApi from '@/api/auth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
  }),

  actions: {
    async login(email: string, password: string) {
      const user = await authApi.login(email, password);
      this.user = user;
      this.isAuthenticated = true;
    },

    async logout() {
      await authApi.logout();
      this.user = null;
      this.isAuthenticated = false;
    },

    async checkAuth() {
      if (!this.token) return;
      try {
        const user = await authApi.getMe();
        this.user = user;
        this.isAuthenticated = true;
      } catch {
        this.logout();
      }
    },
  },
});
```

### DevOps (0.5 giorni)

**Configurare Keycloak realm (opzionale, per OAuth)**

```bash
# Script setup Keycloak
docker exec thc-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user admin \
  --password $KC_PASSWORD

docker exec thc-keycloak /opt/keycloak/bin/kcadm.sh create realms \
  -s realm=thc \
  -s enabled=true
```

### Definition of Done Sprint 2

- [ ] POST /auth/register crea utente in DB
- [ ] POST /auth/login restituisce JWT valido
- [ ] GET /auth/me restituisce utente corrente
- [ ] Frontend login funziona con backend reale
- [ ] Token persistito in localStorage
- [ ] Protected routes verificano token

---

## SPRINT 3: Multi-Org + Lookup Tables

**Durata**: 1 settimana | **Focus**: BE 70%, FE 20%, DevOps 10%

### Backend (3.5 giorni)

**Giorno 1-2: Schema multi-org + migrazioni**

Riferimento: `PRISMA_ENTITY_SCHEMA.md` sezione 4.3 "Entità Organizzative"

```bash
# Aggiungi Federation, Organization, Division a schema.prisma
# Poi:
npx db-diff
npx platformatic db migrations apply
npx prisma generate
```

**Giorno 3: Lookup tables**

Riferimento: `VSCODE_INTEGRATION_GUIDE.md` sezione 4 "Schema Prisma Anagrafiche"

```bash
# Aggiungi tutte le lookup tables:
# - FieldType, GameMode, Facility, WeaponCategory
# - AchievementDefinition, ObjectiveType, DocumentType
# - NotificationTemplate, MapElementType

npx db-diff
npx platformatic db migrations apply
```

**Giorno 4: Seed data + API auto-generate**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Federation di default
  const itl = await prisma.federation.upsert({
    where: { code: 'ITL' },
    update: {},
    create: {
      code: 'ITL',
      name: 'Independent Tactical League',
      country: 'IT',
      email: 'info@itl.it',
      isActive: true,
    },
  });

  // Organization di default
  const ticopsIt = await prisma.organization.upsert({
    where: { code: 'TICOPS-IT' },
    update: {},
    create: {
      federationId: itl.id,
      code: 'TICOPS-IT',
      name: 'TicOps Italia',
      region: 'Lombardia',
      email: 'info@ticops.it',
      isActive: true,
    },
  });

  // Division di default
  await prisma.division.upsert({
    where: { organizationId_code: { organizationId: ticopsIt.id, code: 'MI-NORD' } },
    update: {},
    create: {
      organizationId: ticopsIt.id,
      federationId: itl.id,
      code: 'MI-NORD',
      name: 'Milano Nord',
      isDefault: true,
      isActive: true,
    },
  });

  // Seed lookup tables
  await seedFieldTypes();
  await seedGameModes();
  await seedFacilities();
  // ...
}
```

```bash
npx prisma db seed
```

### Frontend (1 giorno)

**Giorno 5: Generare client + Lookup store**

```bash
# Con Platformatic DB in esecuzione:
cd web/thc-frontend/src
npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts
```

Riferimento: `VSCODE_INTEGRATION_GUIDE.md` sezione 5 "Pattern di Utilizzo"

```typescript
// src/stores/lookupStore.ts
import { defineStore } from 'pinia';
import { getFieldTypes, getGameModes, getFacilities } from '@/api/thc-api';

export const useLookupStore = defineStore('lookup', {
  state: () => ({
    fieldTypes: [],
    gameModes: [],
    facilities: [],
    isLoaded: false,
  }),

  actions: {
    async loadAll() {
      if (this.isLoaded) return;

      const [ft, gm, fac] = await Promise.all([
        getFieldTypes({ where: { isActive: { eq: true } } }),
        getGameModes({ where: { isActive: { eq: true } } }),
        getFacilities({ where: { isActive: { eq: true } } }),
      ]);

      this.fieldTypes = ft;
      this.gameModes = gm;
      this.facilities = fac;
      this.isLoaded = true;
    },
  },
});
```

### DevOps (0.5 giorni)

**Aggiornare CI per eseguire seed in staging**

```yaml
# .github/workflows/deploy-staging.yml
- name: Run migrations and seed
  run: |
    npx platformatic db migrations apply
    npx prisma db seed
```

### Definition of Done Sprint 3

- [ ] Tabelle Federation, Organization, Division create
- [ ] Tutte le lookup tables create e popolate
- [ ] API REST auto-generate per tutte le entità
- [ ] Swagger/OpenAPI disponibile su /documentation
- [ ] Client frontend rigenerato con nuovi tipi
- [ ] Lookup store funzionante

---

## SPRINT 4: Users, Teams, Fields API

**Durata**: 1 settimana | **Focus**: BE 60%, FE 30%, DevOps 10%

### Backend (3 giorni)

**Giorno 1: Schema entità core**

Riferimento: `PRISMA_ENTITY_SCHEMA.md` sezioni 4.4, 4.5, 4.6

```bash
# Aggiungi a schema.prisma:
# - Team, TeamMember, TeamInvite, TeamChallenge (Community Context)
# - Field, FieldReview, FieldSchedule, FieldMap (Location Context)

npx db-diff
npx platformatic db migrations apply
npx prisma generate
```

**Giorno 2: Plugin RLS (Row Level Security)**

Riferimento: `docs/MULTI_ORG_ARCHITECTURE.md` sezione "Permessi e Visibilità"

```typescript
// web/thc-db/plugins/rls.ts
import fp from 'fastify-plugin';

export default fp(async (app) => {
  // Hook che aggiunge filtro divisione a tutte le query
  app.addHook('preHandler', async (request) => {
    if (!request.user) return;

    const { role, divisionId, organizationId, federationId } = request.user;

    // Costruisci filtro basato su ruolo
    let orgFilter = {};

    switch (role) {
      case 'FEDERATION_ADMIN':
        orgFilter = { federationId };
        break;
      case 'ORG_ADMIN':
        orgFilter = { organizationId };
        break;
      default:
        orgFilter = { divisionId };
    }

    // Aggiungi sempre filtro soft delete
    request.rlsFilter = { ...orgFilter, deletedAt: null };
  });
});
```

**Giorno 3: Endpoints custom (business logic)**

```typescript
// web/thc-service/routes/teams.ts
export default async function (app) {
  // POST /teams/:id/join - Richiedi iscrizione
  app.post(
    '/teams/:id/join',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.id;

      // Business logic: verifica requisiti, crea richiesta
      const team = await app.prisma.team.findUnique({
        where: { id, deletedAt: null },
      });

      if (!team) return reply.status(404).send({ error: 'Team not found' });
      if (!team.isRecruiting) return reply.status(400).send({ error: 'Team not recruiting' });

      // Crea invite/request
      const invite = await app.prisma.teamInvite.create({
        data: {
          teamId: id,
          invitedUserId: userId,
          invitedEmail: request.user.email,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return invite;
    }
  );
}
```

### Frontend (1.5 giorni)

**Giorno 4: Swap mock → API reale per Users**

Riferimento: `src/mocks/users.ts`, `src/api/services/`

```typescript
// src/api/users.ts - Wrapper con logica aggiuntiva
import { getUsers, getUsersById, updateUsers } from './thc-api';
import type { GetUsersResponseOK } from './thc-api-types';

export async function getCurrentUser(): Promise<GetUsersResponseOK> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function updateProfile(data: Partial<GetUsersResponseOK>) {
  return updateUsers({ id: data.id!, ...data });
}

// Re-export per retrocompatibilità con codice esistente
export { getUsers, getUsersById };
```

**Giorno 5: Swap mock → API reale per Teams + Fields**

```typescript
// src/composables/useTeams.ts
import { ref, onMounted } from 'vue';
import { getTeams, getTeamsById } from '@/api/thc-api';
import { useAuthStore } from '@/stores/authStore';

export function useMyTeams() {
  const auth = useAuthStore();
  const teams = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    // Usa API reale invece di mock
    teams.value = await getTeams({
      where: {
        members: {
          some: { userId: { eq: auth.user.id } },
        },
        deletedAt: { eq: null },
      },
    });
    loading.value = false;
  });

  return { teams, loading };
}
```

### DevOps (0.5 giorni)

**Aggiungere test API automatizzati**

```yaml
# .github/workflows/ci.yml - Aggiungere step
- name: API Integration Tests
  run: npm run test:api
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/thc_test
```

### Definition of Done Sprint 4

- [ ] Tabelle Team, TeamMember, Field, FieldReview create
- [ ] API CRUD auto-generate funzionanti
- [ ] RLS plugin filtra per divisione
- [ ] Endpoint custom teams/join funzionante
- [ ] Frontend usa API reale per Users, Teams, Fields
- [ ] Test API passano in CI

---

## SPRINT 5: FE → BE Integration Complete

**Durata**: 1 settimana | **Focus**: FE 70%, BE 20%, DevOps 10%

### Frontend (3.5 giorni)

**Obiettivo**: Sostituire TUTTI i mock rimanenti con API reali

**Giorno 1: OrgContext reale**

Riferimento: `docs/MULTI_ORG_ARCHITECTURE.md` sezione "Context"

```typescript
// src/stores/orgStore.ts
import { defineStore } from 'pinia';
import { getFederations, getOrganizations, getDivisions } from '@/api/thc-api';

export const useOrgStore = defineStore('org', {
  state: () => ({
    currentFederation: null,
    currentOrganization: null,
    currentDivision: null,
    availableDivisions: [],
  }),

  actions: {
    async loadUserOrg() {
      const auth = useAuthStore();

      // Carica divisione corrente dell'utente
      const [division] = await getDivisions({
        where: { id: { eq: auth.user.divisionId } },
      });

      this.currentDivision = division;
      // Carica org e federation in cascata
      // ...
    },

    async switchDivision(divisionId: string) {
      // Per admin che possono vedere più divisioni
      // ...
    },
  },
});
```

**Giorno 2-3: Swap tutti i mock**

Checklist da `src/mocks/`:

- [ ] `users.ts` → `getUsers()`
- [ ] `teams.ts` → `getTeams()`
- [ ] `fields.ts` → `getFields()`
- [ ] `matches.ts` → `getMatches()` (Sprint 6)
- [ ] `games.ts` → `getMatches()` (alias)
- [ ] `notifications.ts` → `getNotifications()`
- [ ] `achievements.ts` → `getUserAchievements()`

```typescript
// src/api/index.ts - Barrel export con flag
export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Gradualmente settare true in .env quando pronti
```

**Giorno 4: Admin pages → API reali**

Riferimento: `docs/FEATURES_ROADMAP.md` Feature 14 "Gestione Anagrafiche"

```typescript
// src/pages/admin/entities/AdminUsersEntity.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUsers, createUsers, updateUsers, deleteUsers } from '@/api/thc-api'
import { useOrgStore } from '@/stores/orgStore'

const org = useOrgStore()
const users = ref([])
const loading = ref(true)

onMounted(async () => {
  // Filtro automatico per divisione corrente
  users.value = await getUsers({
    where: {
      divisionId: { eq: org.currentDivision.id },
      deletedAt: { eq: null }
    },
    orderby: { createdAt: 'desc' },
    limit: 50
  })
  loading.value = false
})

async function handleDelete(id: string) {
  // Soft delete
  await updateUsers({ id, deletedAt: new Date().toISOString() })
  users.value = users.value.filter(u => u.id !== id)
}
</script>
```

### Backend (1 giorno)

**Giorno 5: Fix e ottimizzazioni da feedback FE**

- Aggiungere endpoint mancanti richiesti dal FE
- Ottimizzare query N+1 con include
- Aggiungere filtri mancanti

### DevOps (0.5 giorni)

**Environment variables per staging/production**

```bash
# .env.staging
VITE_API_URL=https://api.staging.tuodominio.com
VITE_USE_REAL_API=true

# .env.production
VITE_API_URL=https://api.tuodominio.com
VITE_USE_REAL_API=true
```

### Definition of Done Sprint 5

- [ ] TUTTI i mock sostituiti con API reali
- [ ] OrgContext carica dati da DB
- [ ] Admin CRUD funziona con backend
- [ ] Nessun riferimento a mock in produzione
- [ ] Staging deploy con API reali

---

## SPRINT 6: Matches & Gameplay API

**Durata**: 1 settimana | **Focus**: BE 60%, FE 30%, DevOps 10%

### Backend (3 giorni)

**Giorno 1: Schema Gameplay**

Riferimento: `PRISMA_ENTITY_SCHEMA.md` sezione 4.7 "Gameplay Context"

```bash
# Aggiungi: Match, MatchTeam, MatchParticipant, Round, KillEvent, ObjectiveEvent
npx db-diff
npx platformatic db migrations apply
```

**Giorno 2: Endpoints partite**

```typescript
// web/thc-service/routes/matches.ts
export default async function (app) {
  // POST /matches/:id/start
  app.post(
    '/matches/:id/start',
    {
      preHandler: [app.authenticate, app.requireRole('REFEREE', 'ORG_ADMIN')],
    },
    async (request, reply) => {
      const { id } = request.params;

      return app.prisma.$transaction(async (tx) => {
        const match = await tx.match.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            updatedBy: request.user.id,
          },
        });

        // Crea primo round
        await tx.round.create({
          data: {
            matchId: id,
            roundNumber: 1,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: request.user.id,
            action: 'UPDATE',
            entityType: 'MATCH',
            entityId: id,
            newData: { status: 'IN_PROGRESS' },
          },
        });

        return match;
      });
    }
  );

  // POST /matches/:id/kill - Registra eliminazione
  app.post(
    '/matches/:id/kill',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { killerId, victimId, weapon } = request.body;
      // ...
    }
  );
}
```

**Giorno 3: WebSocket per real-time (base)**

```typescript
// web/thc-service/plugins/websocket.ts
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';

export default fp(async (app) => {
  await app.register(websocket);

  app.get('/ws/match/:matchId', { websocket: true }, (socket, request) => {
    const { matchId } = request.params;

    // Join room per match
    socket.on('message', (message) => {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'KILL':
          // Broadcast a tutti i client nella room
          app.websocketServer.clients.forEach((client) => {
            client.send(
              JSON.stringify({
                type: 'KILL_EVENT',
                payload: data.payload,
              })
            );
          });
          break;
      }
    });
  });
});
```

### Frontend (1.5 giorni)

**Giorno 4-5: Gameplay components → API reali**

Riferimento: `src/components/gameplay/`, `docs/GAMEPLAY_UI_COMPONENTS.md`

```typescript
// src/composables/useMatchRealtime.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useMatchRealtime(matchId: string) {
  const ws = ref<WebSocket | null>(null);
  const events = ref<any[]>([]);
  const connected = ref(false);

  onMounted(() => {
    ws.value = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/match/${matchId}`);

    ws.value.onopen = () => {
      connected.value = true;
    };
    ws.value.onclose = () => {
      connected.value = false;
    };

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      events.value.push(data);

      // Emit per componenti che ascoltano
      // ...
    };
  });

  onUnmounted(() => {
    ws.value?.close();
  });

  function sendKill(killerId: string, victimId: string) {
    ws.value?.send(
      JSON.stringify({
        type: 'KILL',
        payload: { killerId, victimId, timestamp: Date.now() },
      })
    );
  }

  return { connected, events, sendKill };
}
```

### DevOps (0.5 giorni)

**Configurare WebSocket in reverse proxy**

```nginx
# nginx.conf
location /ws/ {
    proxy_pass http://localhost:3042;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Definition of Done Sprint 6

- [ ] Tabelle Match, Round, KillEvent create
- [ ] API matches CRUD funzionante
- [ ] Endpoint start/pause/end match
- [ ] WebSocket base funzionante
- [ ] Frontend gameplay usa API reali
- [ ] Eventi real-time funzionano

---

## SPRINT 7: Membership, Payments, Notifications

**Durata**: 1 settimana | **Focus**: BE 50%, FE 40%, DevOps 10%

### Backend (2.5 giorni)

**Giorno 1: Schema Membership + Rankings**

Riferimento: `PRISMA_ENTITY_SCHEMA.md` sezione 4.8

```bash
# Aggiungi: Season, PlayerRanking, TeamRanking, EloHistory
# Aggiungi: MembershipTier, Membership, MembershipPayment
npx db-diff && npx platformatic db migrations apply
```

**Giorno 2: Stripe integration**

```typescript
// web/thc-service/routes/payments.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function (app) {
  // POST /payments/membership
  app.post(
    '/payments/membership',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { tierId } = request.body;
      const userId = request.user.id;

      const tier = await app.prisma.membershipTier.findUnique({
        where: { id: tierId },
      });

      // Crea Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: tier.name },
              unit_amount: Math.round(tier.price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/membership/success`,
        cancel_url: `${process.env.FRONTEND_URL}/membership/cancel`,
        metadata: { userId, tierId },
      });

      return { sessionId: session.id, url: session.url };
    }
  );

  // Webhook Stripe
  app.post('/webhooks/stripe', async (request, reply) => {
    const sig = request.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === 'checkout.session.completed') {
      const { userId, tierId } = event.data.object.metadata;

      // Crea membership
      await app.prisma.membership.create({
        data: {
          userId,
          tierId,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { received: true };
  });
}
```

**Giorno 3: Notification service**

```typescript
// web/thc-service/services/notifications.ts
export async function sendNotification(
  prisma: PrismaClient,
  userId: string,
  templateCode: string,
  variables: Record<string, string>
) {
  const template = await prisma.notificationTemplate.findFirst({
    where: { code: templateCode, isActive: true },
  });

  if (!template) return;

  // Interpola variabili nel template
  let title = template.titleTemplate;
  let body = template.bodyTemplate;

  for (const [key, value] of Object.entries(variables)) {
    title = title.replace(`{{${key}}}`, value);
    body = body.replace(`{{${key}}}`, value);
  }

  // Crea notifica in-app
  await prisma.notification.create({
    data: {
      userId,
      type: template.category as any,
      title,
      body,
      isRead: false,
    },
  });

  // TODO: Push notification, email
}
```

### Frontend (2 giorni)

**Giorno 4: Membership UI + Stripe Checkout**

```typescript
// src/pages/MembershipPage.vue
<script setup lang="ts">
import { loadStripe } from '@stripe/stripe-js'
import { getMembershipTiers } from '@/api/thc-api'

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
const tiers = ref([])

onMounted(async () => {
  tiers.value = await getMembershipTiers({
    where: { isActive: { eq: true } },
    orderby: { sortOrder: 'asc' }
  })
})

async function subscribe(tierId: string) {
  const res = await fetch(`${API_URL}/payments/membership`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ tierId })
  })

  const { url } = await res.json()
  window.location.href = url  // Redirect a Stripe
}
</script>
```

**Giorno 5: Notifications UI**

```typescript
// src/composables/useNotifications.ts
import { ref, onMounted } from 'vue';
import { getNotifications, updateNotifications } from '@/api/thc-api';

export function useNotifications() {
  const notifications = ref([]);
  const unreadCount = ref(0);

  async function load() {
    notifications.value = await getNotifications({
      where: { userId: { eq: currentUserId }, isRead: { eq: false } },
      orderby: { createdAt: 'desc' },
      limit: 20,
    });
    unreadCount.value = notifications.value.length;
  }

  async function markAsRead(id: string) {
    await updateNotifications({ id, isRead: true, readAt: new Date().toISOString() });
    notifications.value = notifications.value.filter((n) => n.id !== id);
    unreadCount.value--;
  }

  onMounted(load);

  return { notifications, unreadCount, markAsRead, refresh: load };
}
```

### DevOps (0.5 giorni)

**Configurare Stripe webhook endpoint**

```bash
# Stripe CLI per test locale
stripe listen --forward-to localhost:3042/webhooks/stripe
```

### Definition of Done Sprint 7

- [ ] Membership tiers configurabili
- [ ] Stripe checkout funzionante
- [ ] Webhook crea membership su pagamento
- [ ] Sistema notifiche in-app funzionante
- [ ] UI membership e notifiche complete

---

## SPRINT 8: Testing, Performance, Go-Live

**Durata**: 1 settimana | **Focus**: DevOps 50%, Testing 40%, Fix 10%

### Testing (2 giorni)

**Giorno 1: Test coverage backend**

```typescript
// test/api/auth.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Auth API', () => {
  test('POST /auth/register creates user', async () => {
    const app = await build();

    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      },
    });

    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert.ok(body.token);
    assert.strictEqual(body.user.email, 'test@example.com');
  });

  test('POST /auth/login returns token', async () => {
    // ...
  });

  test('GET /auth/me requires auth', async () => {
    // ...
  });
});
```

**Giorno 2: E2E tests frontend**

```typescript
// e2e/login.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[data-testid="email"]', 'player@demo.it');
  await page.fill('[data-testid="password"]', 'demo123');
  await page.click('[data-testid="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL('/login?redirect=/admin');
});
```

### DevOps (2.5 giorni)

**Giorno 3: Production infrastructure**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

**Giorno 4: Monitoring + Logging**

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - '3001:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}

  loki:
    image: grafana/loki

  # Oppure più semplice:
  # uptime-kuma per monitoring
  uptime:
    image: louislam/uptime-kuma
    ports:
      - '3002:3001'
    volumes:
      - uptime-data:/app/data
```

**Giorno 5: Go-Live Checklist**

```markdown
## Pre-Deploy

- [ ] Tutti i test passano (CI green)
- [ ] Database backup configurato
- [ ] SSL certificates validi
- [ ] Environment variables production settate
- [ ] DNS pointing to production server
- [ ] Stripe webhook production configurato

## Deploy

- [ ] `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Migrations applicate
- [ ] Seed data produzione
- [ ] Smoke test manuale

## Post-Deploy

- [ ] Monitoring attivo (uptime checks)
- [ ] Error tracking (Sentry) configurato
- [ ] Analytics (Plausible/Umami) attivo
- [ ] Backup verificato
- [ ] Rimuovere pagina maintenance
- [ ] Annuncio lancio
```

### Definition of Done Sprint 8

- [ ] Test coverage > 80%
- [ ] E2E tests passano
- [ ] Zero errori critici in produzione
- [ ] Monitoring attivo con alert
- [ ] Backup automatico configurato
- [ ] **SITO LIVE** 🚀

---

## Riepilogo Timeline

| Sprint | Focus       | Deliverable Chiave       | DoD Items |
| ------ | ----------- | ------------------------ | --------- |
| **S1** | Infra       | Docker + CI/CD + Health  | 6         |
| **S2** | Auth        | Login/Register E2E       | 6         |
| **S3** | Multi-org   | Lookup tables + Seed     | 6         |
| **S4** | Core API    | Users/Teams/Fields       | 6         |
| **S5** | Integration | Mock → API reale         | 5         |
| **S6** | Gameplay    | Matches + WebSocket      | 6         |
| **S7** | Business    | Payments + Notifications | 5         |
| **S8** | Launch      | Testing + Go-Live        | 6         |

**Totale**: 8 settimane → **Go-Live fine Febbraio 2025**

---

## File di Riferimento Progetto

| Documento            | Path                              | Contenuto                |
| -------------------- | --------------------------------- | ------------------------ |
| Schema Prisma        | `PRISMA_ENTITY_SCHEMA.md`         | Tutte le entità + indici |
| Guida VSCode         | `VSCODE_INTEGRATION_GUIDE.md`     | Setup + Lookup tables    |
| Copilot Instructions | `.github/copilot-instructions.md` | Convenzioni sviluppo     |
| Multi-org            | `docs/MULTI_ORG_ARCHITECTURE.md`  | Gerarchia + RLS          |
| Features             | `docs/FEATURES_ROADMAP.md`        | Task atomici FE          |
| Gantt                | `docs/GANTT_TIMELINE.md`          | Timeline esistente       |
| Roadmap              | `docs/TICOPS_COMPLETE_ROADMAP.md` | Vision completa          |

---

## Quick Commands

```bash
# Avvio sviluppo
docker-compose up -d        # DB + Redis
npm run dev                 # Platformatic Watt

# Schema changes
npx db-diff                 # Genera migrazione
npx platformatic db migrations apply
npx prisma generate         # Rigenera client

# Frontend client
cd web/thc-frontend/src
npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts

# Test
npm run test                # Unit tests
npm run test:api            # API tests
npm run test:e2e            # E2E Playwright

# Deploy
git push origin develop     # → Auto deploy staging
git push origin main        # → Auto deploy production
```
