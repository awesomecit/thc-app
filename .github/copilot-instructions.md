# GitHub Copilot Instructions - TicOps Health Check (THC)

> Documento di riferimento per GitHub Copilot e agenti AI per lo sviluppo del backend THC. Versione:
> 1.0 | Stack: Platformatic Watt + Prisma + Fastify

---

## Contesto Progetto

TicOps è una piattaforma multi-tenant per la gestione di competizioni airsoft tactical. Il backend
utilizza **Platformatic Watt** come runtime che orchestra più servizi, con **Prisma** come ORM per
la gestione dello schema e delle migrazioni, e **Platformatic DB** per la generazione automatica di
API REST/GraphQL.

### Architettura Multi-Organizzazione

Il sistema implementa una gerarchia a tre livelli con isolamento dati:

```
Federation (Federazione Nazionale)
├── Organization (Franchising/Provincia)
│   ├── Division (Settore/Area)
│   │   ├── Users
│   │   ├── Teams
│   │   ├── Fields
│   │   ├── Matches
│   │   └── ...altre entità
```

Ogni entità di business contiene campi denormalizzati (`divisionId`, `organizationId`,
`federationId`) per query veloci e Row Level Security.

---

## Stack Tecnologico

| Layer            | Tecnologia            | Uso                                         |
| ---------------- | --------------------- | ------------------------------------------- |
| Runtime          | Platformatic Watt 3.x | Orchestrazione servizi                      |
| Database Service | Platformatic DB       | Auto-generazione API REST/GraphQL           |
| ORM              | Prisma                | Schema management, migrazioni, query custom |
| Framework        | Fastify               | Plugin custom, middleware                   |
| Database         | PostgreSQL 15+        | Storage primario                            |
| Cache            | Redis                 | Sessioni, rate limiting                     |
| Auth             | Keycloak / JWT        | Autenticazione OIDC                         |

---

## Convenzioni Prisma per Platformatic

### Naming Convention Obbligatorie

Platformatic DB si aspetta nomi in **snake_case pluralizzato**. Prisma usa **PascalCase** per i
modelli. Utilizza sempre `@@map()` e `@map()` per allineare le convenzioni:

```prisma
// ✅ CORRETTO: Mapping esplicito per compatibilità Platformatic
model TeamMember {
  id        Int      @id @default(autoincrement())

  // Campo nel codice Prisma: camelCase
  // Colonna nel DB: snake_case
  teamId    Int      @map("team_id")
  userId    Int      @map("user_id")
  joinedAt  DateTime @default(now()) @map("joined_at")

  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  // Tabella nel DB: snake_case plurale
  @@map("team_members")
}

// ❌ ERRATO: Senza mapping, Platformatic genererà endpoint inconsistenti
model TeamMember {
  id       Int  @id @default(autoincrement())
  teamId   Int  // Diventa "teamId" nel DB, non "team_id"
}
```

### Campi Standard per Tutte le Entità

Ogni entità di business deve includere questi campi:

```prisma
model EntityName {
  // Primary Key
  id        String   @id @default(uuid()) @db.Uuid

  // Multi-org hierarchy (denormalizzato per query veloci)
  divisionId     String  @map("division_id") @db.Uuid
  organizationId String  @map("organization_id") @db.Uuid
  federationId   String  @map("federation_id") @db.Uuid

  // Audit fields
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  createdBy String?   @map("created_by") @db.Uuid
  updatedBy String?   @map("updated_by") @db.Uuid

  // Soft delete
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by") @db.Uuid

  // Relazioni
  division     Division     @relation(fields: [divisionId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
  federation   Federation   @relation(fields: [federationId], references: [id])

  // Indici per performance
  @@index([divisionId])
  @@index([organizationId])
  @@index([deletedAt])

  @@map("entity_names")
}
```

### Gestione Soft Delete

Non usare `DELETE` fisico. Implementa soft delete con filtro automatico:

```prisma
// Nel modello
deletedAt DateTime? @map("deleted_at")

// Negli indici - per escludere i record eliminati dalle query
@@index([deletedAt])
```

Nel plugin Fastify, aggiungi il filtro automatico:

```typescript
// Plugin per filtro soft delete automatico
app.addHook('preHandler', async (request, reply) => {
  // Aggiungi filtro where: { deletedAt: null } a tutte le query
  request.prismaFilter = { deletedAt: null };
});
```

### Tabella Versions (Ignorare)

Platformatic usa Postgrator per le migrazioni, che crea una tabella `versions`. Marcala con
`@@ignore`:

```prisma
model versions {
  version BigInt    @id
  name    String?
  md5     String?
  run_at  DateTime? @db.Timestamptz(6)

  @@ignore // Non generare client Prisma per questa tabella di sistema
}
```

---

## Workflow di Sviluppo

### Flusso per Nuove Entità

```bash
# 1. Modifica schema.prisma (fonte di verità)
# 2. Genera migrazione SQL compatibile con Postgrator
npx db-diff

# 3. Applica migrazione con Platformatic CLI
npx platformatic db migrations apply

# 4. Sincronizza schema Prisma con DB (cattura eventuali modifiche esterne)
npx prisma db pull

# 5. Genera Prisma Client aggiornato
npx prisma generate

# 6. Avvia servizio
npx platformatic db start
```

### Flusso per Modifiche Schema

```bash
# 1. Modifica schema.prisma
# 2. Genera migrazione (up + down)
npx db-diff --migrations-dir ./migrations

# 3. Verifica la migrazione generata prima di applicare
cat migrations/TIMESTAMP_migration_name.do.sql
cat migrations/TIMESTAMP_migration_name.undo.sql

# 4. Applica
npx platformatic db migrations apply

# 5. Rigenera client
npx prisma generate
```

---

## Pattern per Plugin Fastify

### Struttura Plugin con Prisma

```typescript
// plugins/custom-logic.ts
import type { FastifyInstance } from 'fastify';
import prismaPlugin from '@sabinthedev/fastify-prisma';

export default async function (app: FastifyInstance) {
  // Registra Prisma (gestisce connessioni automaticamente)
  await app.register(prismaPlugin);

  // Endpoint custom che usa Prisma per logica non coperta da auto-gen
  app.post('/matches/:id/start', {
    preHandler: [app.authenticate], // Assumendo middleware auth registrato
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      // Transazione atomica su più tabelle
      const result = await app.prisma.$transaction(async (tx) => {
        // 1. Verifica permessi
        const match = await tx.match.findUnique({
          where: { id, deletedAt: null },
          include: { organizer: true },
        });

        if (!match) throw new Error('Match not found');
        if (match.organizerId !== userId) throw new Error('Unauthorized');

        // 2. Aggiorna stato match
        const updatedMatch = await tx.match.update({
          where: { id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            updatedBy: userId,
          },
        });

        // 3. Crea evento audit
        await tx.auditLog.create({
          data: {
            entityType: 'MATCH',
            entityId: id,
            action: 'STARTED',
            performedBy: userId,
            metadata: { previousStatus: match.status },
          },
        });

        return updatedMatch;
      });

      return reply.send(result);
    },
  });
}
```

### Row Level Security nel Plugin

```typescript
// lib/rls-filter.ts
import type { FastifyRequest } from 'fastify';

export function buildRlsFilter(request: FastifyRequest) {
  const user = request.user;

  // Federation Admin: vede tutto nella federazione
  if (user.role === 'federation_admin') {
    return { federationId: user.federationId, deletedAt: null };
  }

  // Org Admin: vede tutto nell'organizzazione
  if (user.role === 'org_admin') {
    return { organizationId: user.organizationId, deletedAt: null };
  }

  // Division Manager: vede solo la sua divisione
  if (user.role === 'division_manager') {
    return { divisionId: user.divisionId, deletedAt: null };
  }

  // Default: solo propri dati
  return { divisionId: user.divisionId, deletedAt: null };
}
```

---

## Indici e Ottimizzazione

### Indici Consigliati per Pattern di Query THC

```prisma
model Match {
  // ... campi ...

  // Indice composto per query dashboard
  // "Mostra tutte le partite della mia divisione, ordinate per data"
  @@index([divisionId, scheduledAt(sort: Desc)])

  // Indice per ricerca partite aperte
  @@index([status, divisionId])

  // Indice per calendario
  @@index([scheduledAt, status])

  // Indice per soft delete (esclusione record eliminati)
  @@index([deletedAt])

  // Indice unique per constraint business
  @@unique([fieldId, scheduledAt]) // No due partite stesso campo/ora
}

model User {
  // Indice unique per login
  @@unique([email])

  // Indice per ricerca per username
  @@index([username])

  // Indice composto per query "utenti della mia divisione"
  @@index([divisionId, status])

  // Indice per ricerca per ruolo
  @@index([role, divisionId])
}

model Team {
  // Tag univoco per identificazione rapida
  @@unique([tag])

  // Ricerca team per divisione
  @@index([divisionId, status])

  // Ricerca team in reclutamento
  @@index([isRecruiting, divisionId])
}
```

### Query Ottimizzate con Prisma

```typescript
// ❌ EVITA: N+1 query
const matches = await prisma.match.findMany();
for (const match of matches) {
  const field = await prisma.field.findUnique({ where: { id: match.fieldId } });
}

// ✅ PREFERISCI: Eager loading
const matches = await prisma.match.findMany({
  include: {
    field: true,
    teams: { include: { members: true } },
    referee: { select: { id: true, name: true } },
  },
  where: {
    divisionId: user.divisionId,
    deletedAt: null,
    scheduledAt: { gte: new Date() },
  },
  orderBy: { scheduledAt: 'asc' },
  take: 20,
});

// ✅ Per aggregazioni complesse, usa raw query
const stats = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.name,
    COUNT(DISTINCT mt.match_id) as total_matches,
    SUM(CASE WHEN m.winner_team_id = t.id THEN 1 ELSE 0 END) as wins
  FROM teams t
  LEFT JOIN match_teams mt ON mt.team_id = t.id
  LEFT JOIN matches m ON m.id = mt.match_id
  WHERE t.division_id = ${divisionId}::uuid
    AND t.deleted_at IS NULL
  GROUP BY t.id
  ORDER BY wins DESC
  LIMIT 10
`;
```

---

## Validazioni e Constraint

### Constraint a Livello Database

```prisma
model User {
  email    String  @unique
  username String  @unique
  elo      Int     @default(1000)

  // CHECK constraint via raw SQL nella migrazione
  // ALTER TABLE users ADD CONSTRAINT elo_range CHECK (elo >= 0 AND elo <= 5000);
}

model Match {
  maxPlayers Int @map("max_players")
  minPlayers Int @map("min_players")

  // Constraint: min <= max (da aggiungere in migrazione)
  // ALTER TABLE matches ADD CONSTRAINT players_range CHECK (min_players <= max_players);
}
```

### Enum per Stati

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  BANNED
}

enum MatchStatus {
  DRAFT
  SCHEDULED
  CHECK_IN
  IN_PROGRESS
  PAUSED
  COMPLETED
  CANCELLED
}

enum TeamMemberRole {
  LEADER
  OFFICER
  MEMBER
  RECRUIT
}
```

---

## Struttura Directory Consigliata

```
thc-project/
├── web/
│   ├── thc-db/
│   │   ├── platformatic.json
│   │   ├── migrations/
│   │   │   ├── 001_initial.do.sql
│   │   │   ├── 001_initial.undo.sql
│   │   │   └── ...
│   │   └── plugins/
│   │       ├── custom-endpoints.ts
│   │       └── rls-middleware.ts
│   ├── thc-service/
│   │   └── ... business logic ...
│   └── thc-gateway/
│       └── platformatic.json
├── prisma/
│   └── schema.prisma          # Fonte di verità per lo schema
├── packages/
│   └── auth/
│       └── ...                # Modulo autenticazione
├── watt.json                  # Orchestrazione runtime
└── .env
```

---

## Comandi Utili

```bash
# Visualizza schema corrente
npx prisma studio

# Formatta schema
npx prisma format

# Valida schema
npx prisma validate

# Reset database (ATTENZIONE: cancella tutti i dati)
npx prisma migrate reset

# Genera solo le migrazioni senza applicare
npx db-diff --dry-run

# Visualizza differenze tra schema e DB
npx prisma db pull --print
```

---

## Checklist Pre-Commit

Prima di committare modifiche allo schema:

- [ ] `@@map()` presente su tutti i modelli (snake_case plurale)
- [ ] `@map()` presente su tutti i campi con più parole (snake_case)
- [ ] Campi audit presenti (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`)
- [ ] Soft delete presente (`deletedAt`, `deletedBy`)
- [ ] Campi multi-org presenti (`divisionId`, `organizationId`, `federationId`)
- [ ] Indici definiti per campi usati in WHERE e ORDER BY
- [ ] Unique constraint su campi business-critical
- [ ] Relazioni esplicite con `@relation()`
- [ ] Migrazione generata e testata localmente
- [ ] `versions` table marcata con `@@ignore`

---

## Riferimenti

- [Prisma Documentation](https://www.prisma.io/docs)
- [Platformatic DB Docs](https://docs.platformatic.dev/docs/db/overview)
- [Integrate Prisma with Platformatic](https://docs.platformatic.dev/docs/guides/prisma)
- [TicOps Multi-Org Architecture](./docs/MULTI_ORG_ARCHITECTURE.md)
- [TicOps Complete Roadmap](./docs/TICOPS_COMPLETE_ROADMAP.md)
