# Guida Integrazione VSCode - TicOps in THC App

> Configurazione completa per sviluppo assistito con GitHub Copilot, Platformatic Client e lookup
> tables. Versione: 1.0 | Data: Dicembre 2024

---

## Indice

1. [Setup VSCode per THC](#1-setup-vscode-per-thc)
2. [Generazione Client Frontend](#2-generazione-client-frontend)
3. [Tabelle Anagrafiche (Lookup Tables)](#3-tabelle-anagrafiche-lookup-tables)
4. [Schema Prisma Anagrafiche](#4-schema-prisma-anagrafiche)
5. [Pattern di Utilizzo](#5-pattern-di-utilizzo)
6. [Estensione e Customizzazione](#6-estensione-e-customizzazione)

---

## 1. Setup VSCode per THC

### 1.1 Struttura File di Configurazione

Per far funzionare al meglio GitHub Copilot e altri assistenti AI nel progetto THC, posiziona i file
di istruzioni in queste posizioni:

```
thc-project/
├── .github/
│   └── copilot-instructions.md      # Istruzioni globali Copilot
├── .vscode/
│   ├── settings.json                # Settings VSCode progetto
│   ├── extensions.json              # Estensioni raccomandate
│   └── tasks.json                   # Task automatizzati
├── docs/
│   ├── PRISMA_ENTITY_SCHEMA.md      # Schema entità completo
│   ├── LOOKUP_TABLES.md             # Documentazione anagrafiche
│   └── API_CONTRACTS.md             # Contratti API
├── prisma/
│   └── schema.prisma                # Schema database
└── web/
    ├── thc-db/                      # Platformatic DB
    ├── thc-frontend/                # Frontend Vue/React
    │   └── src/
    │       ├── api/                 # Client generato
    │       │   ├── thc-api.ts       # Funzioni API tipizzate
    │       │   └── thc-api-types.d.ts
    │       └── ...
    └── ...
```

### 1.2 VSCode Settings Raccomandate

Crea `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,

  "files.associations": {
    "*.prisma": "prisma"
  },

  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "prisma": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.platformatic": true
  },

  "editor.quickSuggestions": {
    "strings": true
  },

  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },

  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 1.3 Estensioni Raccomandate

Crea `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "github.copilot",
    "github.copilot-chat",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "vue.volar",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv",
    "orta.vscode-jest",
    "humao.rest-client"
  ]
}
```

### 1.4 Task Automatizzati

Crea `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "THC: Generate API Client",
      "type": "shell",
      "command": "cd web/thc-frontend/src && npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "THC: Prisma Generate",
      "type": "shell",
      "command": "npx prisma generate",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "THC: DB Diff (Generate Migration)",
      "type": "shell",
      "command": "npx db-diff --migrations-dir web/thc-db/migrations",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "THC: Apply Migrations",
      "type": "shell",
      "command": "cd web/thc-db && npx platformatic db migrations apply",
      "group": "build",
      "problemMatcher": []
    },
    {
      "label": "THC: Start All Services",
      "type": "shell",
      "command": "npx platformatic start",
      "group": "test",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "THC: Full Schema Update",
      "type": "shell",
      "command": "npx db-diff && cd web/thc-db && npx platformatic db migrations apply && cd ../.. && npx prisma generate && cd web/thc-frontend/src && npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts",
      "group": "build",
      "problemMatcher": [],
      "detail": "Genera migrazione, applica, rigenera Prisma client e API client frontend"
    }
  ]
}
```

---

## 2. Generazione Client Frontend

### 2.1 Workflow Completo

Quando Platformatic DB è in esecuzione, genera il client tipizzato per il frontend:

```bash
# 1. Assicurati che Platformatic DB sia attivo
cd web/thc-db
npx platformatic db start &

# 2. Genera il client frontend
cd ../thc-frontend/src
npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts
```

Questo genera due file:

- `thc-api.ts`: Funzioni per ogni endpoint REST
- `thc-api-types.d.ts`: Tipi TypeScript per request/response

### 2.2 Configurazione CORS in Platformatic

Assicurati che `web/thc-db/platformatic.json` abbia CORS configurato:

```json
{
  "$schema": "https://schemas.platformatic.dev/@platformatic/db/3.0.0.json",
  "server": {
    "hostname": "{PLT_SERVER_HOSTNAME}",
    "port": "{PLT_SERVER_PORT}",
    "cors": {
      "origin": {
        "regexp": "{PLT_SERVER_CORS_ORIGIN}"
      }
    }
  },
  "db": {
    "connectionString": "{DATABASE_URL}"
  }
}
```

E nel `.env`:

```env
PLT_SERVER_HOSTNAME=127.0.0.1
PLT_SERVER_PORT=3042
PLT_SERVER_CORS_ORIGIN=^http://localhost.*
DATABASE_URL=postgresql://user:pass@localhost:5432/thc
```

### 2.3 Utilizzo nel Frontend (Vue 3)

```typescript
// src/composables/useApi.ts
import { ref } from 'vue';
import {
  setBaseUrl,
  setDefaultHeaders,
  // Entità principali
  getUsers,
  getTeams,
  getFields,
  getMatches,
  // Lookup tables
  getFieldTypes,
  getGameModes,
  getMatchStatuses,
  getFacilities,
  // etc.
} from '@/api/thc-api';

// Configura base URL
setBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3042');

// Hook per autenticazione
export function useApiAuth() {
  function setAuthToken(token: string) {
    setDefaultHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  function clearAuth() {
    setDefaultHeaders({});
  }

  return { setAuthToken, clearAuth };
}

// Hook generico per fetch con loading/error state
export function useApiQuery<T>(fetchFn: () => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function execute() {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fetchFn();
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, execute };
}
```

### 2.4 Utilizzo nel Frontend (React)

```typescript
// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import {
  setBaseUrl,
  setDefaultHeaders,
  getUsers,
  getTeams,
  getFields,
  // Lookup
  getFieldTypes,
  getGameModes,
  type GetFieldTypesResponseOK,
} from '@/api/thc-api';

// Configura all'avvio dell'app
setBaseUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3042');

// Hook per lookup tables con caching
const lookupCache = new Map<string, any>();

export function useLookup<T>(key: string, fetchFn: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>(() => lookupCache.get(key) || []);
  const [loading, setLoading] = useState(!lookupCache.has(key));
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && lookupCache.has(key)) {
        setData(lookupCache.get(key));
        return;
      }

      setLoading(true);
      try {
        const result = await fetchFn();
        lookupCache.set(key, result);
        setData(result);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [key, fetchFn]
  );

  return { data, loading, error, fetch };
}

// Esempio: hook specifico per tipi campo
export function useFieldTypes() {
  return useLookup('fieldTypes', getFieldTypes);
}
```

---

## 3. Tabelle Anagrafiche (Lookup Tables)

Le tabelle anagrafiche sono fondamentali per un sistema configurabile. Seguono un pattern comune:
`code` univoco + `name`/`description` localizzabile + metadata opzionali.

### 3.1 Elenco Completo Anagrafiche THC

| Tabella                   | Scopo                                     | Customizzabile per |
| ------------------------- | ----------------------------------------- | ------------------ |
| `field_types`             | Tipi di campo (Outdoor, Indoor, CQB...)   | Federation         |
| `game_modes`              | Modalità di gioco con regole              | Federation         |
| `match_statuses`          | Stati partita con transizioni             | Global             |
| `user_statuses`           | Stati utente                              | Global             |
| `team_statuses`           | Stati team                                | Global             |
| `team_member_roles`       | Ruoli nel team (Leader, Officer...)       | Global             |
| `user_tiers`              | Livelli abbonamento                       | Federation         |
| `referee_levels`          | Livelli patentino arbitro                 | Federation         |
| `facilities`              | Servizi campo (Parcheggio, Docce...)      | Global             |
| `weapon_categories`       | Categorie armi per statistiche            | Global             |
| `achievement_definitions` | Definizioni achievement                   | Federation         |
| `notification_templates`  | Template notifiche                        | Organization       |
| `document_types`          | Tipi documento (ID, Certificato...)       | Global             |
| `payment_methods`         | Metodi pagamento                          | Organization       |
| `listing_conditions`      | Condizioni prodotto marketplace           | Global             |
| `event_types`             | Tipi evento calendario                    | Global             |
| `kill_types`              | Tipi eliminazione (Standard, Headshot...) | Global             |
| `objective_types`         | Tipi obiettivo (Flag, Bomb, Zone...)      | Global             |

### 3.2 Pattern Standard Anagrafica

Ogni lookup table segue questo pattern:

```prisma
model LookupTableName {
  id          String   @id @default(uuid()) @db.Uuid

  // Identificazione
  code        String   @unique @db.VarChar(50)  // Codice univoco (es. "OUTDOOR")
  name        String   @db.VarChar(100)         // Nome display (es. "Campo Outdoor")
  description String?  @db.Text                 // Descrizione estesa

  // Scope (opzionale - per customizzazione)
  federationId String? @map("federation_id") @db.Uuid  // Se specifico per federazione

  // Ordinamento e stato
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  isSystem    Boolean  @default(false) @map("is_system")  // Non eliminabile

  // Metadata estensibile
  metadata    Json     @default("{}")  // Dati aggiuntivi specifici

  // Localizzazione (opzionale)
  translations Json    @default("{}") // {"en": {"name": "...", "desc": "..."}}

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relazioni
  federation  Federation? @relation(fields: [federationId], references: [id])

  @@index([code])
  @@index([federationId])
  @@index([isActive])
  @@index([sortOrder])
  @@map("lookup_table_names")
}
```

### 3.3 Esempio Concreto: FieldType con Metadata

Per il Field Mapper e altre customizzazioni, il campo `metadata` può contenere configurazioni
specifiche:

```prisma
model FieldType {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text

  federationId String?  @map("federation_id") @db.Uuid

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")
  isSystem     Boolean  @default(false) @map("is_system")

  // Metadata specifico per tipo campo
  // Esempio: {
  //   "icon": "tree",
  //   "color": "#228B22",
  //   "defaultMaxPlayers": 60,
  //   "typicalAreaM2": { "min": 5000, "max": 50000 },
  //   "mapperConfig": {
  //     "defaultElements": ["trees", "paths", "buildings"],
  //     "gridSize": 10,
  //     "backgroundColor": "#8FBC8F"
  //   }
  // }
  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  federation   Federation? @relation(fields: [federationId], references: [id])
  fields       Field[]

  @@index([code])
  @@index([federationId])
  @@index([isActive])
  @@map("field_types")
}
```

---

## 4. Schema Prisma Anagrafiche

Aggiungi queste entità al tuo `schema.prisma`:

```prisma
// ============================================================================
// LOOKUP TABLES (ANAGRAFICHE)
// ============================================================================

// ---------------------------------------------------------------------------
// FIELD TYPES - Tipi di campo da gioco
// ---------------------------------------------------------------------------
model FieldType {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text

  federationId String?  @map("federation_id") @db.Uuid

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")
  isSystem     Boolean  @default(false) @map("is_system")

  // Config per Field Mapper: defaultElements, gridSize, colors
  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  federation   Federation? @relation(fields: [federationId], references: [id])
  fields       Field[]

  @@index([code])
  @@index([federationId])
  @@index([isActive])
  @@map("field_types")
}

// ---------------------------------------------------------------------------
// GAME MODES - Modalità di gioco con regole configurabili
// ---------------------------------------------------------------------------
model GameMode {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text

  federationId String?  @map("federation_id") @db.Uuid

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")
  isSystem     Boolean  @default(false) @map("is_system")
  isRanked     Boolean  @default(true) @map("is_ranked")

  // Regole: {
  //   "minPlayers": 10, "maxPlayers": 40,
  //   "teamsCount": 2, "roundsCount": 3,
  //   "roundDurationMinutes": 15,
  //   "respawnEnabled": true, "respawnDelaySeconds": 30,
  //   "objectives": ["flag_capture", "elimination"],
  //   "scoringRules": {...}
  // }
  rules        Json     @default("{}")
  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  federation   Federation? @relation(fields: [federationId], references: [id])
  matches      Match[]

  @@unique([federationId, code])
  @@index([code])
  @@index([federationId])
  @@index([isActive])
  @@index([isRanked])
  @@map("game_modes")
}

// ---------------------------------------------------------------------------
// FACILITIES - Servizi disponibili nei campi
// ---------------------------------------------------------------------------
model Facility {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text
  icon         String?  @db.VarChar(50)  // Nome icona (es. "parking", "shower")
  category     String?  @db.VarChar(50)  // "amenities", "services", "safety"

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  fieldFacilities FieldFacility[]

  @@index([code])
  @@index([category])
  @@index([isActive])
  @@map("facilities")
}

// Tabella ponte per relazione N:N Field-Facility
model FieldFacility {
  id         String   @id @default(uuid()) @db.Uuid
  fieldId    String   @map("field_id") @db.Uuid
  facilityId String   @map("facility_id") @db.Uuid

  // Dettagli specifici (es. "50 posti auto", "2 docce")
  details    String?  @db.VarChar(200)

  createdAt  DateTime @default(now()) @map("created_at")

  field      Field    @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  facility   Facility @relation(fields: [facilityId], references: [id])

  @@unique([fieldId, facilityId])
  @@index([fieldId])
  @@index([facilityId])
  @@map("field_facilities")
}

// ---------------------------------------------------------------------------
// WEAPON CATEGORIES - Categorie armi per statistiche
// ---------------------------------------------------------------------------
model WeaponCategory {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text
  icon         String?  @db.VarChar(50)

  // Configurazione: rangeM, rateOfFire, typicalDamage
  specs        Json     @default("{}")

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  killEvents   KillEvent[]

  @@index([code])
  @@index([isActive])
  @@map("weapon_categories")
}

// ---------------------------------------------------------------------------
// ACHIEVEMENT DEFINITIONS - Definizioni achievement/badge
// ---------------------------------------------------------------------------
model AchievementDefinition {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String   @db.Text

  federationId String?  @map("federation_id") @db.Uuid

  icon         String?  @db.VarChar(100)
  badgeImage   String?  @map("badge_image") @db.VarChar(500)
  category     String   @db.VarChar(50)  // "combat", "social", "milestone"

  // Criteri: { "type": "kills", "threshold": 100 }
  // oppure: { "type": "matches_won", "threshold": 10 }
  criteria     Json     @default("{}")

  // Reward: punti, tier upgrade, etc.
  reward       Json     @default("{}")

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")
  isSecret     Boolean  @default(false) @map("is_secret")  // Hidden until earned

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  federation   Federation? @relation(fields: [federationId], references: [id])
  userAchievements UserAchievement[]

  @@unique([federationId, code])
  @@index([code])
  @@index([federationId])
  @@index([category])
  @@index([isActive])
  @@map("achievement_definitions")
}

// Achievement sbloccati dagli utenti
model UserAchievement {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  achievementId   String   @map("achievement_id") @db.Uuid

  unlockedAt      DateTime @default(now()) @map("unlocked_at")
  progress        Int      @default(100)  // Percentuale completamento

  // Dettagli unlock (es. match_id che ha triggerato)
  metadata        Json     @default("{}")

  user            User     @relation(fields: [userId], references: [id])
  achievement     AchievementDefinition @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@index([unlockedAt])
  @@map("user_achievements")
}

// ---------------------------------------------------------------------------
// OBJECTIVE TYPES - Tipi obiettivo per modalità di gioco
// ---------------------------------------------------------------------------
model ObjectiveType {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text
  icon         String?  @db.VarChar(50)

  // Scoring: punti per completamento
  defaultPoints Int     @default(1) @map("default_points")

  // Compatibilità con game modes
  compatibleModes String[] @map("compatible_modes")  // ["CTF", "DOMINATION"]

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  objectiveEvents ObjectiveEvent[]

  @@index([code])
  @@index([isActive])
  @@map("objective_types")
}

// ---------------------------------------------------------------------------
// DOCUMENT TYPES - Tipi documento per membership/verifica
// ---------------------------------------------------------------------------
model DocumentType {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text

  // Requisiti: { "requiredFor": ["membership"], "expiresAfterMonths": 12 }
  requirements Json     @default("{}")

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  userDocuments UserDocument[]

  @@index([code])
  @@index([isActive])
  @@map("document_types")
}

// Documenti caricati dagli utenti
model UserDocument {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  documentTypeId String   @map("document_type_id") @db.Uuid

  fileUrl        String   @map("file_url") @db.VarChar(500)
  fileName       String   @map("file_name") @db.VarChar(200)

  status         String   @default("PENDING") @db.VarChar(20)  // PENDING, VERIFIED, REJECTED
  verifiedAt     DateTime? @map("verified_at")
  verifiedBy     String?   @map("verified_by") @db.Uuid
  expiresAt      DateTime? @map("expires_at")
  rejectionReason String?  @map("rejection_reason") @db.Text

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user           User     @relation(fields: [userId], references: [id])
  documentType   DocumentType @relation(fields: [documentTypeId], references: [id])

  @@index([userId])
  @@index([documentTypeId])
  @@index([status])
  @@index([expiresAt])
  @@map("user_documents")
}

// ---------------------------------------------------------------------------
// NOTIFICATION TEMPLATES - Template notifiche configurabili
// ---------------------------------------------------------------------------
model NotificationTemplate {
  id             String   @id @default(uuid()) @db.Uuid
  code           String   @db.VarChar(50)
  name           String   @db.VarChar(100)

  organizationId String?  @map("organization_id") @db.Uuid

  // Canali abilitati
  emailEnabled   Boolean  @default(true) @map("email_enabled")
  pushEnabled    Boolean  @default(true) @map("push_enabled")
  inAppEnabled   Boolean  @default(true) @map("in_app_enabled")

  // Template con placeholder: "Ciao {{userName}}, la partita {{matchName}}..."
  titleTemplate  String   @map("title_template") @db.VarChar(200)
  bodyTemplate   String   @map("body_template") @db.Text
  emailSubject   String?  @map("email_subject") @db.VarChar(200)
  emailBody      String?  @map("email_body") @db.Text

  // Categoria per filtraggio preferenze utente
  category       String   @db.VarChar(50)  // "match", "team", "system", "promo"

  sortOrder      Int      @default(0) @map("sort_order")
  isActive       Boolean  @default(true) @map("is_active")

  translations   Json     @default("{}")

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization   Organization? @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, code])
  @@index([code])
  @@index([organizationId])
  @@index([category])
  @@index([isActive])
  @@map("notification_templates")
}

// ---------------------------------------------------------------------------
// MAP ELEMENT TYPES - Tipi elemento per Field Mapper
// ---------------------------------------------------------------------------
model MapElementType {
  id           String   @id @default(uuid()) @db.Uuid
  code         String   @unique @db.VarChar(50)
  name         String   @db.VarChar(100)
  description  String?  @db.Text

  category     String   @db.VarChar(50)  // "structure", "vegetation", "zone", "path"
  icon         String?  @db.VarChar(50)

  // Rendering config: { "defaultWidth": 20, "defaultHeight": 20, "color": "#...", "zIndex": 10 }
  renderConfig Json     @default("{}") @map("render_config")

  // Props editabili: [{ "name": "rotation", "type": "number", "default": 0 }]
  editableProps Json    @default("[]") @map("editable_props")

  sortOrder    Int      @default(0) @map("sort_order")
  isActive     Boolean  @default(true) @map("is_active")

  metadata     Json     @default("{}")
  translations Json     @default("{}")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([code])
  @@index([category])
  @@index([isActive])
  @@map("map_element_types")
}
```

---

## 5. Pattern di Utilizzo

### 5.1 Fetch Lookup Tables all'Avvio App

```typescript
// src/stores/lookupStore.ts (Zustand per React)
import { create } from 'zustand';
import {
  getFieldTypes,
  getGameModes,
  getFacilities,
  getWeaponCategories,
  type GetFieldTypesResponseOK,
  type GetGameModesResponseOK,
} from '@/api/thc-api';

interface LookupState {
  fieldTypes: GetFieldTypesResponseOK[];
  gameModes: GetGameModesResponseOK[];
  facilities: any[];
  weaponCategories: any[];
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;

  loadAll: () => Promise<void>;
  getFieldTypeByCode: (code: string) => GetFieldTypesResponseOK | undefined;
  getGameModeByCode: (code: string) => GetGameModesResponseOK | undefined;
}

export const useLookupStore = create<LookupState>((set, get) => ({
  fieldTypes: [],
  gameModes: [],
  facilities: [],
  weaponCategories: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  loadAll: async () => {
    if (get().isLoaded || get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const [fieldTypes, gameModes, facilities, weaponCategories] = await Promise.all([
        getFieldTypes({ where: { isActive: { eq: true } }, orderby: { sortOrder: 'asc' } }),
        getGameModes({ where: { isActive: { eq: true } }, orderby: { sortOrder: 'asc' } }),
        getFacilities({ where: { isActive: { eq: true } }, orderby: { sortOrder: 'asc' } }),
        getWeaponCategories({ where: { isActive: { eq: true } }, orderby: { sortOrder: 'asc' } }),
      ]);

      set({
        fieldTypes,
        gameModes,
        facilities,
        weaponCategories,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  getFieldTypeByCode: (code) => get().fieldTypes.find((ft) => ft.code === code),
  getGameModeByCode: (code) => get().gameModes.find((gm) => gm.code === code),
}));
```

### 5.2 Componente Dropdown Generico

```tsx
// src/components/ui/LookupSelect.tsx
import { useLookupStore } from '@/stores/lookupStore'

interface LookupSelectProps {
  lookupType: 'fieldTypes' | 'gameModes' | 'facilities' | 'weaponCategories'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  filter?: (item: any) => boolean
}

export function LookupSelect({
  lookupType,
  value,
  onChange,
  placeholder = 'Seleziona...',
  disabled = false,
  filter,
}: LookupSelectProps) {
  const items = useLookupStore(state => state[lookupType])
  const filteredItems = filter ? items.filter(filter) : items

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border rounded-md"
    >
      <option value="">{placeholder}</option>
      {filteredItems.map((item) => (
        <option key={item.id} value={item.code}>
          {item.name}
        </option>
      ))}
    </select>
  )
}

// Utilizzo
<LookupSelect
  lookupType="fieldTypes"
  value={selectedFieldType}
  onChange={setSelectedFieldType}
  placeholder="Tipo campo"
/>

<LookupSelect
  lookupType="gameModes"
  value={selectedGameMode}
  onChange={setSelectedGameMode}
  filter={(mode) => mode.isRanked}  // Solo modalità ranked
/>
```

### 5.3 Utilizzo Metadata per Field Mapper

```typescript
// src/components/field-mapper/useMapperConfig.ts
import { useLookupStore } from '@/stores/lookupStore';

export function useMapperConfig(fieldTypeCode: string) {
  const getFieldTypeByCode = useLookupStore((state) => state.getFieldTypeByCode);
  const fieldType = getFieldTypeByCode(fieldTypeCode);

  // Estrai config dal metadata
  const mapperConfig = fieldType?.metadata?.mapperConfig || {
    defaultElements: ['trees', 'buildings'],
    gridSize: 10,
    backgroundColor: '#E8E8E8',
  };

  const defaultElements = mapperConfig.defaultElements || [];
  const gridSize = mapperConfig.gridSize || 10;
  const backgroundColor = mapperConfig.backgroundColor || '#FFFFFF';

  return {
    fieldType,
    mapperConfig,
    defaultElements,
    gridSize,
    backgroundColor,
  };
}

// Nel Field Mapper
function FieldMapper({ fieldTypeCode }: { fieldTypeCode: string }) {
  const { defaultElements, gridSize, backgroundColor } = useMapperConfig(fieldTypeCode);

  // Usa la configurazione per inizializzare l'editor
  // ...
}
```

---

## 6. Estensione e Customizzazione

### 6.1 Aggiungere Nuova Anagrafica

Quando serve una nuova lookup table:

1. **Aggiungi il modello Prisma** seguendo il pattern standard
2. **Genera migrazione**: `npx db-diff`
3. **Applica migrazione**: `npx platformatic db migrations apply`
4. **Rigenera client**:
   `npx platformatic client http://localhost:3042 --frontend --name thc-api --language ts`
5. **Aggiungi al lookup store** nel frontend
6. **Popola dati iniziali** con seed script

### 6.2 Seed Script per Dati Iniziali

```typescript
// prisma/seed/lookups.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFieldTypes() {
  const fieldTypes = [
    {
      code: 'OUTDOOR',
      name: 'Campo Outdoor',
      description: "Campo all'aperto con vegetazione naturale",
      isSystem: true,
      sortOrder: 1,
      metadata: {
        icon: 'tree',
        color: '#228B22',
        defaultMaxPlayers: 60,
        mapperConfig: {
          defaultElements: ['trees', 'paths', 'spawn_zones'],
          gridSize: 10,
          backgroundColor: '#8FBC8F',
        },
      },
    },
    {
      code: 'INDOOR',
      name: 'Campo Indoor',
      description: 'Struttura al chiuso',
      isSystem: true,
      sortOrder: 2,
      metadata: {
        icon: 'building',
        color: '#708090',
        defaultMaxPlayers: 30,
        mapperConfig: {
          defaultElements: ['walls', 'rooms', 'spawn_zones'],
          gridSize: 5,
          backgroundColor: '#D3D3D3',
        },
      },
    },
    {
      code: 'CQB',
      name: 'CQB (Close Quarter Battle)',
      description: 'Struttura per combattimento ravvicinato',
      isSystem: true,
      sortOrder: 3,
      metadata: {
        icon: 'crosshair',
        color: '#8B0000',
        defaultMaxPlayers: 20,
        mapperConfig: {
          defaultElements: ['walls', 'doors', 'cover', 'spawn_zones'],
          gridSize: 2,
          backgroundColor: '#A9A9A9',
        },
      },
    },
    // ... altri tipi
  ];

  for (const ft of fieldTypes) {
    await prisma.fieldType.upsert({
      where: { code: ft.code },
      update: ft,
      create: ft,
    });
  }

  console.log(`Seeded ${fieldTypes.length} field types`);
}

async function seedFacilities() {
  const facilities = [
    { code: 'PARKING', name: 'Parcheggio', icon: 'parking', category: 'amenities', sortOrder: 1 },
    { code: 'SHOWERS', name: 'Docce', icon: 'shower', category: 'amenities', sortOrder: 2 },
    { code: 'LOCKERS', name: 'Armadietti', icon: 'locker', category: 'amenities', sortOrder: 3 },
    {
      code: 'RENTAL',
      name: 'Noleggio attrezzatura',
      icon: 'shopping-bag',
      category: 'services',
      sortOrder: 4,
    },
    { code: 'SHOP', name: 'Shop', icon: 'store', category: 'services', sortOrder: 5 },
    { code: 'BAR', name: 'Bar/Ristoro', icon: 'coffee', category: 'amenities', sortOrder: 6 },
    {
      code: 'FIRST_AID',
      name: 'Primo soccorso',
      icon: 'first-aid',
      category: 'safety',
      sortOrder: 7,
    },
    { code: 'CHRONO', name: 'Cronografo', icon: 'gauge', category: 'services', sortOrder: 8 },
  ];

  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { code: f.code },
      update: f,
      create: f,
    });
  }

  console.log(`Seeded ${facilities.length} facilities`);
}

async function main() {
  await seedFieldTypes();
  await seedFacilities();
  // ... altre seed
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 6.3 Admin UI per Gestione Anagrafiche

Per ogni anagrafica, l'admin avrà una pagina CRUD standard:

```
/admin/lookups/field-types      → CRUD tipi campo
/admin/lookups/game-modes       → CRUD modalità gioco
/admin/lookups/facilities       → CRUD servizi
/admin/lookups/achievements     → CRUD achievement
/admin/lookups/map-elements     → CRUD elementi mappa
...
```

Con componenti generici per:

- Lista con filtri (isActive, category, federationId)
- Form create/edit con campi standard + JSON editor per metadata
- Import/export per backup configurazioni

---

## Checklist Integrazione

- [ ] Copiare `.github/copilot-instructions.md` nel progetto
- [ ] Configurare `.vscode/settings.json` e `extensions.json`
- [ ] Aggiungere task VSCode per automazione
- [ ] Configurare CORS in Platformatic DB
- [ ] Generare client frontend con `npx platformatic client`
- [ ] Aggiungere lookup tables allo schema Prisma
- [ ] Eseguire migrazione e rigenerare client
- [ ] Creare lookup store nel frontend
- [ ] Implementare componenti dropdown generici
- [ ] Eseguire seed script per dati iniziali
- [ ] Creare pagine admin per gestione anagrafiche

---

## Riferimenti

- [Platformatic Frontend Client](https://docs.platformatic.dev/docs/client/frontend)
- [GitHub Copilot Custom Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [TicOps Multi-Org Architecture](./docs/MULTI_ORG_ARCHITECTURE.md)
