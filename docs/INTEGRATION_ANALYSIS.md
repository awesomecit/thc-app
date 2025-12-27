# THC Project - Analisi Integrata e Prossimi Step

**Data**: 27 Dicembre 2024  
**Versione**: 1.0

---

## 📊 Stato Attuale del Progetto

### Completato ✅

#### Backend (thc-db - Auth MVP)

- ✅ **Migrations 002-003**: Tabelle `system_users` e `domain_users` create
- ✅ **Auth Plugin**: JWT validation integrato (`plugins/auth.ts`)
- ✅ **DB Helpers**: bcrypt password hashing, CRUD helpers (`plugins/db-helpers.ts`)
- ✅ **Routes Auth**: `/auth/register`, `/auth/login`, `/auth/me` (`routes/auth.ts`)
- ✅ **Routes Users**: `/users/domain` (POST), `/users/domain/me` (GET) (`routes/users.ts`)
- ✅ **Dependencies**: @thc/auth, bcrypt, pg, @testcontainers/postgresql installate
- ✅ **Test Infrastructure**: Scripts test:unit e test:integration configurati

#### Frontend (ticops-frontend - MVP 85%)

- ✅ **12 Feature Complete** (vedi FEATURES_ROADMAP.md)
- ✅ **React 18.3.1 + Vite 5.4.19 + Shadcn/UI**
- ✅ **Field Mapper**: Integrazione @ticops/field-mapper con TLDraw
- ✅ **Mock Data System**: Completo per tutti i ruoli RBAC
- ✅ **150+ Componenti, 45+ Pagine**

#### DevOps

- ✅ **Git Submodules**: ticops-frontend, ticops-field-mapper integrati
- ✅ **Watt Orchestration**: Gateway routing configurato parzialmente
- ✅ **Quality Gates**: Husky, commitlint, secretlint, prettier
- ✅ **124 Tests Passing**: Unit + Integration (@thc/auth package)

### In Corso 🚧

- 🚧 **Backend TicOps**: Repurposing thc-db come TicOps backend
- 🚧 **Prisma Schema**: Non ancora implementato (vedi PRISMA_ENTITY_SCHEMA.md)
- 🚧 **Multi-Org System**: Context provider non implementato
- 🚧 **Integration Tests**: thc-db routes non ancora testate

### Blockers 🚫

- ❌ **npm run dev FAILED**: plt-crud-sample rimosso, orchestrazione non testata
- ❌ **No Postgres Running**: Migrations non applicate, DB non attivo
- ❌ **No Health Endpoints**: /health/live, /health/ready non esposti
- ❌ **No Swagger UI**: OpenAPI documentation non configurata
- ❌ **Frontend Disconnesso**: Mock data ancora in uso, no API reali

---

## 🎯 Gap Analysis: Documentazione vs Implementazione

### 1. Schema Database (PRISMA_ENTITY_SCHEMA.md)

**Definito**:

- 8 Bounded Context completi (Identity, Community, Location, Gameplay, Ranking, Commerce,
  Membership, Administration)
- 50+ entità con relazioni complete
- Pattern trasversali: Multi-Org (divisionId, organizationId, federationId), Audit, Soft Delete,
  UUID
- Indici e ottimizzazioni definiti

**Implementato**:

- ❌ **Nessuna entità Prisma** (solo 2 tabelle auth SQL raw)
- ❌ **No schema.prisma** nel progetto
- ❌ **No Prisma Client** generato
- ❌ **No seed script**

**Gap**: 100% da implementare

### 2. Lookup Tables (VSCODE_INTEGRATION_GUIDE.md)

**Definite**:

- 18 tabelle anagrafiche (FieldType, GameMode, Facility, WeaponCategory, AchievementDefinition,
  ObjectiveType, DocumentType, NotificationTemplate, MapElementType, etc.)
- Pattern standard con code, name, description, metadata JSONB
- Seed script per dati iniziali
- Frontend client generation workflow

**Implementato**:

- ❌ **Nessuna lookup table** esistente
- ❌ **No client frontend** generato da Platformatic
- ❌ **No lookup store** (Zustand/Pinia)

**Gap**: 100% da implementare

### 3. Roadmap XP (XP_ROADMAP_FULLSTACK.md)

**Pianificato**: 8 sprint settimanali

- Sprint 1-2: Infrastructure (DevOps 60%, BE 30%, FE 10%)
- Sprint 3-4: Core Backend (Multi-org entities, Lookups, Users/Teams/Fields API)
- Sprint 5-6: Integration (FE → BE swap mock)
- Sprint 7-8: Production (Membership, Payments, Testing, Go-Live)

**Attuale**: Sprint 1 parziale (40% completato)

- ✅ Docker setup (parziale, no docker-compose.yml)
- ✅ Platformatic Watt setup
- ❌ CI/CD pipeline (no GitHub Actions)
- ❌ Health check (non esposto)
- ❌ Prima migrazione Prisma (non fatta)
- ❌ Frontend health status (non implementato)

**Gap**: Sprint 1 incomplete, Sprint 2-8 non iniziati

### 4. GANTT Timeline (ticops-frontend/docs)

**Pianificato**:

- Sprint 0: MVP Complete ✅ (Dicembre 2024)
- Sprint 1-2: Multi-Org Foundation 🚧 (Gennaio 2025) - 10% completato
- Sprint 3-4: Admin Anagrafiche 📋 (Gennaio-Febbraio 2025)
- Sprint 5: Testing ⏳ (Marzo 2025)

**Attuale**: Sprint 1 multi-org NON iniziato (mock data non creato, context provider non
implementato)

**Gap**: Roadmap frontend sconnessa da backend reale

---

## 🔄 Allineamento Strategico

### Problema Principale

I tre documenti (PRISMA_ENTITY_SCHEMA, VSCODE_INTEGRATION_GUIDE, XP_ROADMAP_FULLSTACK) descrivono
un'architettura **full-stack TicOps completa**, ma il progetto attuale ha:

1. **Frontend TicOps**: 85% completo ma con **mock data** (no backend)
2. **Backend THC-DB**: Solo **auth MVP** (2 tabelle user), no entità TicOps
3. **Orchestrazione**: Gateway configurato ma **non testato**
4. **Database**: **Postgres non attivo**, migrations non applicate

### Decisione Strategica Necessaria

**Opzione A: Bottom-Up (Backend-First)**

- Implementare schema Prisma completo
- Creare tutte le migrations
- Popolare lookup tables
- Generare API REST/GraphQL
- Poi collegare frontend

**Tempo stimato**: 6-8 settimane (Sprint 1-4 di XP_ROADMAP)

**Opzione B: Top-Down (Integration-First)**

- Minimal Backend per sbloccare frontend
- Implementare solo entità critiche (User, Team, Field, Match)
- Swap mock → API reale progressivamente
- Aggiungere entità su richiesta

**Tempo stimato**: 2-3 settimane (Sprint 1-2 di XP_ROADMAP)

**Opzione C: Hybrid (Vertical Slice)**

- Scegliere 1 feature end-to-end (es: "Ricerca Campi")
- Implementare solo tabelle necessarie (Field, FieldType, FieldReview)
- Collegare frontend → backend per quella feature
- Ripetere per altre feature

**Tempo stimato**: 3-4 settimane (Sprint 1-3 di XP_ROADMAP)

---

## ✅ Raccomandazione: Opzione B (Integration-First)

### Motivazione

1. **Frontend è pronto**: 85% completato, solo bisogna swap mock → API
2. **Auth è funzionante**: Base solida per partire
3. **YAGNI**: Non serve tutto lo schema Prisma subito
4. **Feedback rapido**: Frontend funzionante dà valore immediato
5. **Risk mitigation**: Orchestrazione non testata va verificata subito

### Next Sprint (Sprint 1 Revised)

**Obiettivo**: Backend minimo + Orchestrazione funzionante + Prima feature connessa

**Durata**: 1 settimana (27 Dic - 3 Gen)

---

## 📋 Sprint 1 Revised: Minimal Backend + Orchestration

### Day 1 (27 Dic): Database Foundation

**Task 1.1**: Setup PostgreSQL + Health Check [4h]

```bash
# Subtask 1.1.1: Creare docker-compose.yml (1h)
# Subtask 1.1.2: Avviare Postgres + Redis (0.5h)
# Subtask 1.1.3: Applicare migrations esistenti (0.5h)
# Subtask 1.1.4: Creare routes/root.ts con /health (1h)
# Subtask 1.1.5: Testare health check (1h)
```

**Deliverables**:

- [ ] `docker-compose.yml` con postgres, redis, keycloak
- [ ] Migrations 001-003 applicate
- [ ] GET /health/live → {status: "ok", services: {db: "ok", redis: "ok"}}
- [ ] GET /health/ready → {status: "ready", migrations: "applied"}

---

### Day 2 (28 Dic): Orchestration Fix

**Task 1.2**: Fix Gateway + Test npm run dev [6h]

```bash
# Subtask 1.2.1: Rimuovere riferimenti ticops-api da gateway (0.5h)
# Subtask 1.2.2: Configurare routing /api → thc-db (1h)
# Subtask 1.2.3: Configurare routing /ticops → ticops-frontend (1h)
# Subtask 1.2.4: Test npm run dev (2h)
# Subtask 1.2.5: Fix errori orchestrazione (1.5h)
```

**Deliverables**:

- [ ] Gateway watt.json corretto
- [ ] npm run dev avvia tutti i servizi
- [ ] http://localhost:3042/health → 200 OK
- [ ] http://localhost:3042/ticops → Frontend Vite
- [ ] http://localhost:3042/api/auth/login → 404 (route non protetta)

---

### Day 3 (29 Dic): Swagger + Integration Tests

**Task 1.3**: OpenAPI Documentation [4h]

```bash
# Subtask 1.3.1: Verificare OpenAPI auto-generation (1h)
# Subtask 1.3.2: Aggiungere @fastify/swagger per custom routes (1.5h)
# Subtask 1.3.3: Testare /documentation (0.5h)
# Subtask 1.3.4: Documentare endpoints in README (1h)
```

**Task 1.4**: Integration Tests thc-db Routes [4h]

```bash
# Subtask 1.4.1: Creare test/integration/auth.integration.test.ts (2h)
# Subtask 1.4.2: Test POST /auth/register (1h)
# Subtask 1.4.3: Test POST /auth/login + GET /auth/me (1h)
```

**Deliverables**:

- [ ] http://localhost:3042/documentation → Swagger UI
- [ ] test/integration/auth.integration.test.ts → 5+ tests passing
- [ ] Coverage auth routes > 80%

---

### Day 4 (30 Dic): Minimal Prisma Schema

**Task 1.5**: Schema Prisma Minimal [6h]

```bash
# Subtask 1.5.1: Creare prisma/schema.prisma (1h)
# Subtask 1.5.2: Definire Federation, Organization, Division (1.5h)
# Subtask 1.5.3: Definire User (completo con profilo) (1h)
# Subtask 1.5.4: Definire FieldType lookup (0.5h)
# Subtask 1.5.5: Generare migration con db-diff (1h)
# Subtask 1.5.6: Applicare migration + test (1h)
```

**Entities Minimal**:

```prisma
// Multi-Org
model Federation { /* 5 campi */ }
model Organization { /* 8 campi */ }
model Division { /* 8 campi */ }

// User (merge con system_users esistente)
model User { /* 20+ campi */ }
model UserProfile { /* 15 campi */ }

// Lookup
model FieldType { /* 10 campi + metadata JSONB */ }
```

**Deliverables**:

- [ ] prisma/schema.prisma creato
- [ ] Migration 004.do.sql generata
- [ ] npx prisma generate → Client creato
- [ ] Seed script con 1 federation, 1 org, 1 division, 3 field types

---

### Day 5 (31 Dic): Frontend Integration (Feature 1)

**Task 1.6**: Swap Mock → API per OrgContext [6h]

```bash
# Subtask 1.6.1: Generare client Platformatic (1h)
# Subtask 1.6.2: Creare src/stores/orgStore.ts (2h)
# Subtask 1.6.3: Sostituire mock divisions → API reale (1.5h)
# Subtask 1.6.4: Testare division switcher (1.5h)
```

**Deliverables**:

- [ ] src/api/thc-api.ts generato
- [ ] src/api/thc-api-types.d.ts generato
- [ ] src/stores/orgStore.ts usa getFederations(), getOrganizations(), getDivisions()
- [ ] Division switcher in Header funzionante
- [ ] Console log conferma: "Using REAL API"

---

## 🎯 Definition of Done - Sprint 1 Revised

### Backend

- [ ] PostgreSQL + Redis + Keycloak running in Docker
- [ ] Migrations 001-004 applicate
- [ ] GET /health endpoint funzionante
- [ ] Swagger UI accessibile
- [ ] Auth routes testate (5+ integration tests)
- [ ] Prisma schema minimal (Federation, Organization, Division, User, FieldType)
- [ ] Seed data popolato

### DevOps

- [ ] docker-compose up avvia tutti i servizi
- [ ] npm run dev avvia Watt con hot-reload
- [ ] Gateway routing configurato e testato
- [ ] Environment variables documentate

### Frontend

- [ ] Client Platformatic generato
- [ ] OrgStore usa API reali
- [ ] Division switcher funzionante
- [ ] Nessun errore console
- [ ] Feature flag USE_REAL_API=true

### Documentazione

- [ ] README.md aggiornato con setup instructions
- [ ] API.md con tutti gli endpoint
- [ ] CHANGELOG.md aggiornato

---

## 📈 Sprint Successivi (Preview)

### Sprint 2 (3-10 Gen): Core Entities + Field Search

- Implementare Field, FieldReview, FieldSchedule
- Swap feature "Ricerca Campi" mock → API
- Integration tests per Field API

### Sprint 3 (10-17 Gen): Team + Match Entities

- Implementare Team, TeamMember, Match
- Swap feature "Team" e "Match Organizer" mock → API
- WebSocket base per real-time

### Sprint 4 (17-24 Gen): Lookups + Admin CRUD

- Implementare tutte le lookup tables
- Admin pages per gestione anagrafiche
- Generare client completo

### Sprint 5-8: Seguire XP_ROADMAP_FULLSTACK.md

---

## 🚀 Immediate Next Action

**INIZIARE ORA**: Task 1.1 (Database Foundation)

```bash
# Step 1: Creare docker-compose.yml
cd /home/antoniocittadino/MyRepos/thc-app

# Step 2: Avviare servizi
docker-compose up -d

# Step 3: Applicare migrations
cd web/thc-db
npx platformatic db migrations apply

# Step 4: Creare health check route
# (crea routes/root.ts)

# Step 5: Testare
npm run dev
curl http://localhost:3042/health
```

**Timeboxed**: 4 ore MAX (fine giornata 27 Dic)

---

## 📝 Note Finali

### Integrazione Documenti

I tre file allegati sono **documentazione di design**, non implementazione. Rappresentano
l'**architettura target** per TicOps completo. Il progetto attuale è a:

- **Backend**: 5% implementato (solo auth MVP)
- **Schema Prisma**: 0% implementato
- **Lookup Tables**: 0% implementato
- **Multi-Org**: 0% implementato
- **Frontend Integration**: 0% (mock only)

### Allineamento Roadmap

**XP_ROADMAP_FULLSTACK.md** è la roadmap **definitiva** da seguire, ma va **adattata** allo stato
attuale:

- Sprint 1 originale assume "green field" → RIVISTO per partire da auth esistente
- Sprint 2-8 sono ancora validi, ma timing va rivisto dopo Sprint 1

**GANTT_TIMELINE.md** (frontend) va **sincronizzato** con backend reale dopo Sprint 2.

### Decisioni Architetturali

1. **Usare Prisma + Platformatic DB**: Schema Prisma come source of truth, Postgrator per
   migrations, Platformatic per auto-gen API
2. **Multi-Org denormalizzato**: divisionId, organizationId, federationId in ogni entity per RLS
   veloce
3. **Soft delete**: deletedAt su tutte le entities
4. **UUID**: id primary key per tutte le entities
5. **Lookup tables con metadata JSONB**: Configurabilità senza schema change

---

**Data Ultimo Aggiornamento**: 27 Dicembre 2024, 01:30  
**Prossimo Review**: Fine Sprint 1 (3 Gennaio 2025)
