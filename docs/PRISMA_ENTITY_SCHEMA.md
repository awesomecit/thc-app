# TicOps - Schema Entità Prisma Completo

> Documento di riferimento per lo schema database THC. Versione: 1.0 | Data: Dicembre 2024

---

## Indice

1. [Panoramica Architettura Dati](#1-panoramica-architettura-dati)
2. [Domini e Bounded Context](#2-domini-e-bounded-context)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [Schema Prisma Completo](#4-schema-prisma-completo)
5. [Indici e Ottimizzazioni](#5-indici-e-ottimizzazioni)
6. [Note Implementative](#6-note-implementative)

---

## 1. Panoramica Architettura Dati

### Pattern Trasversali

Tutte le entità di business implementano questi pattern:

| Pattern         | Campi                                              | Scopo                           |
| --------------- | -------------------------------------------------- | ------------------------------- |
| **Multi-Org**   | `divisionId`, `organizationId`, `federationId`     | Isolamento dati gerarchico, RLS |
| **Audit**       | `createdAt`, `updatedAt`, `createdBy`, `updatedBy` | Tracciabilità modifiche         |
| **Soft Delete** | `deletedAt`, `deletedBy`                           | Eliminazione logica reversibile |
| **UUID**        | `id` (UUID v4)                                     | Identificatori distribuiti      |

### Gerarchia Organizzativa

```
┌─────────────────────────────────────────────────────────────┐
│                      FEDERATION                              │
│                 (es. ITL - Independent Tactical League)      │
└─────────────────────────────┬───────────────────────────────┘
                              │ 1:N
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ ORGANIZATION  │     │ ORGANIZATION  │     │ ORGANIZATION  │
│ TicOps Lomb.  │     │ TicOps Veneto │     │ TicOps Emilia │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │ 1:N
   ┌────┼────┐
   ▼    ▼    ▼
┌────┐┌────┐┌────┐
│DIV ││DIV ││DIV │  (Milano Nord, Milano Sud, Bergamo)
└────┘└────┘└────┘
   │
   │ 1:N per ogni entità
   ▼
[Users, Teams, Fields, Matches, Events, Memberships, ...]
```

---

## 2. Domini e Bounded Context

### 2.1 Identity Context (Autenticazione e Utenti)

| Entità                 | Descrizione        | Relazioni Principali              |
| ---------------------- | ------------------ | --------------------------------- |
| `User`                 | Utente del sistema | → Division, → Team, → Memberships |
| `UserProfile`          | Profilo esteso     | → User (1:1)                      |
| `UserSettings`         | Preferenze utente  | → User (1:1)                      |
| `RefereeCertification` | Patentino arbitro  | → User, → Federation              |

### 2.2 Community Context (Team e Sociale)

| Entità          | Descrizione         | Relazioni Principali             |
| --------------- | ------------------- | -------------------------------- |
| `Team`          | Squadra             | → Division, → Members, → Matches |
| `TeamMember`    | Appartenenza a team | → Team, → User                   |
| `TeamInvite`    | Invito a team       | → Team, → User                   |
| `TeamChallenge` | Sfida tra team      | → Team (x2), → Match             |

### 2.3 Location Context (Campi e Strutture)

| Entità          | Descrizione         | Relazioni Principali           |
| --------------- | ------------------- | ------------------------------ |
| `Field`         | Campo da gioco      | → Division, → Owner, → Matches |
| `FieldReview`   | Recensione campo    | → Field, → User                |
| `FieldSchedule` | Disponibilità       | → Field                        |
| `FieldMap`      | Mappa tattica campo | → Field                        |

### 2.4 Gameplay Context (Partite e Competizioni)

| Entità             | Descrizione          | Relazioni Principali                     |
| ------------------ | -------------------- | ---------------------------------------- |
| `Match`            | Partita              | → Field, → Teams, → Organizer, → Referee |
| `MatchTeam`        | Team in partita      | → Match, → Team                          |
| `MatchParticipant` | Giocatore in partita | → Match, → User                          |
| `Round`            | Round di partita     | → Match                                  |
| `KillEvent`        | Evento eliminazione  | → Round, → Killer, → Victim              |
| `ObjectiveEvent`   | Evento obiettivo     | → Round, → Team                          |

### 2.5 Ranking Context (Classifiche e ELO)

| Entità          | Descrizione          | Relazioni Principali |
| --------------- | -------------------- | -------------------- |
| `PlayerRanking` | Classifica giocatore | → User, → Division   |
| `TeamRanking`   | Classifica team      | → Team, → Division   |
| `EloHistory`    | Storico ELO          | → User               |
| `Season`        | Stagione competitiva | → Federation         |

### 2.6 Membership Context (Tesseramento)

| Entità              | Descrizione         | Relazioni Principali   |
| ------------------- | ------------------- | ---------------------- |
| `Membership`        | Tesseramento        | → User, → Organization |
| `MembershipTier`    | Livello abbonamento | → Federation           |
| `MembershipPayment` | Pagamento           | → Membership           |

### 2.7 Calendar Context (Eventi)

| Entità              | Descrizione       | Relazioni Principali    |
| ------------------- | ----------------- | ----------------------- |
| `Event`             | Evento calendario | → Division, → Field     |
| `EventRegistration` | Iscrizione evento | → Event, → User/Team    |
| `Tournament`        | Torneo            | → Federation, → Matches |

### 2.8 Commerce Context (Shop e Marketplace)

| Entità               | Descrizione          | Relazioni Principali |
| -------------------- | -------------------- | -------------------- |
| `Shop`               | Negozio              | → Division, → Owner  |
| `Product`            | Prodotto             | → Shop, → Category   |
| `ProductCategory`    | Categoria prodotti   | -                    |
| `MarketplaceListing` | Annuncio marketplace | → User, → Division   |
| `Order`              | Ordine               | → Shop, → User       |

### 2.9 Communication Context

| Entità         | Descrizione   | Relazioni Principali     |
| -------------- | ------------- | ------------------------ |
| `Conversation` | Conversazione | → Participants           |
| `Message`      | Messaggio     | → Conversation, → Sender |
| `Notification` | Notifica      | → User                   |

### 2.10 Administration Context

| Entità          | Descrizione            | Relazioni Principali      |
| --------------- | ---------------------- | ------------------------- |
| `AuditLog`      | Log audit              | → User                    |
| `SystemSetting` | Configurazione sistema | → Federation/Organization |

---

## 3. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CORE ENTITIES                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  FEDERATION  │
                    ├──────────────┤
                    │ id           │
                    │ name         │
                    │ code         │
                    │ country      │
                    │ settings     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
     ┌────────────────┐    │   ┌──────────────────┐
     │ MEMBERSHIP_TIER│    │   │REFEREE_CERTIFIC. │
     └────────────────┘    │   └──────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │   ORGANIZATION   │
                  ├──────────────────┤
                  │ id               │
                  │ federationId     │◄────────────┐
                  │ name             │             │
                  │ code             │             │
                  │ region           │             │
                  └────────┬─────────┘             │
                           │                       │
              ┌────────────┼────────────┐          │
              ▼            ▼            ▼          │
        ┌──────────┐ ┌──────────┐ ┌──────────┐    │
        │ DIVISION │ │ DIVISION │ │ DIVISION │    │
        └────┬─────┘ └──────────┘ └──────────┘    │
             │                                     │
    ┌────────┼────────┬──────────┬──────────┐     │
    ▼        ▼        ▼          ▼          ▼     │
┌──────┐ ┌──────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│ USER │ │ TEAM │ │ FIELD │ │ MATCH │ │ SHOP  │  │
└──┬───┘ └──┬───┘ └───┬───┘ └───┬───┘ └───────┘  │
   │        │         │         │                 │
   │        │         │    ┌────┴────┐            │
   │        │         │    ▼         ▼            │
   │        │         │ ┌───────┐ ┌───────────┐   │
   │        │         │ │ ROUND │ │MATCH_TEAM │   │
   │        │         │ └───┬───┘ └───────────┘   │
   │        │         │     │                     │
   │        │         │     ▼                     │
   │        │         │ ┌────────────┐            │
   │        │         │ │ KILL_EVENT │            │
   │        │         │ └────────────┘            │
   │        │         │                           │
   ▼        ▼         ▼                           │
┌──────────────────────────────────────┐          │
│          SHARED REFERENCES           │          │
│  (divisionId, organizationId,        │──────────┘
│   federationId in ogni entità)       │
└──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              USER RELATIONSHIPS                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │     USER     │
                              ├──────────────┤
                              │ id           │
                              │ email        │
                              │ username     │
                              │ role         │
                              │ elo          │
                              │ tier         │
                              └──────┬───────┘
                                     │
       ┌─────────────┬───────────────┼───────────────┬─────────────┐
       │             │               │               │             │
       ▼             ▼               ▼               ▼             ▼
┌─────────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ USER_PROFILE│ │TEAM_MEMB.│ │ MEMBERSHIP │ │ ELO_HISTORY│ │PLAYER_RANK │
└─────────────┘ └──────────┘ └────────────┘ └────────────┘ └────────────┘
                     │
                     ▼
               ┌──────────┐
               │   TEAM   │
               └──────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MATCH RELATIONSHIPS                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    MATCH     │
                              ├──────────────┤
                              │ id           │
                              │ fieldId      │────────► FIELD
                              │ organizerId  │────────► USER
                              │ refereeId    │────────► USER
                              │ mode         │
                              │ status       │
                              │ settings     │
                              └──────┬───────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
       ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
       │ MATCH_TEAM  │        │MATCH_PARTIC.│        │    ROUND    │
       ├─────────────┤        ├─────────────┤        ├─────────────┤
       │ matchId     │        │ matchId     │        │ matchId     │
       │ teamId      │        │ userId      │        │ roundNumber │
       │ slot        │        │ status      │        │ status      │
       │ score       │        │ checkedIn   │        │ startedAt   │
       └─────────────┘        └─────────────┘        └──────┬──────┘
                                                           │
                                          ┌────────────────┼────────────────┐
                                          ▼                                 ▼
                                   ┌─────────────┐                   ┌─────────────┐
                                   │ KILL_EVENT  │                   │OBJECTIVE_EV.│
                                   ├─────────────┤                   ├─────────────┤
                                   │ roundId     │                   │ roundId     │
                                   │ killerId    │                   │ teamId      │
                                   │ victimId    │                   │ type        │
                                   │ timestamp   │                   │ timestamp   │
                                   │ position    │                   │ points      │
                                   └─────────────┘                   └─────────────┘
```

---

## 4. Schema Prisma Completo

### 4.1 Configurazione Base

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4.2 Enumerazioni

```prisma
// ============================================================================
// ENUMERAZIONI
// ============================================================================

enum UserRole {
  PLAYER
  TEAM_LEADER
  REFEREE
  FIELD_MANAGER
  SHOP_OWNER
  DIVISION_MANAGER
  ORG_ADMIN
  FEDERATION_ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  PENDING
  ACTIVE
  INACTIVE
  SUSPENDED
  BANNED
}

enum UserTier {
  FREE
  BRONZE
  SILVER
  GOLD
  PLATINUM
  DIAMOND
}

enum TeamStatus {
  ACTIVE
  INACTIVE
  DISBANDED
  SUSPENDED
}

enum TeamMemberRole {
  LEADER
  OFFICER
  MEMBER
  RECRUIT
}

enum FieldType {
  OUTDOOR
  INDOOR
  CQB
  WOODLAND
  URBAN
  MIXED
}

enum FieldStatus {
  PENDING
  ACTIVE
  MAINTENANCE
  CLOSED
}

enum MatchMode {
  TDM           // Team Deathmatch
  CTF           // Capture The Flag
  DOMINATION
  SEARCH_DESTROY
  HOSTAGE
  VIP
  MILSIM
  CUSTOM
}

enum MatchStatus {
  DRAFT
  SCHEDULED
  REGISTRATION_OPEN
  REGISTRATION_CLOSED
  CHECK_IN
  BRIEFING
  IN_PROGRESS
  PAUSED
  COMPLETED
  CANCELLED
}

enum RoundStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum MembershipStatus {
  PENDING
  ACTIVE
  EXPIRED
  CANCELLED
  SUSPENDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum EventType {
  MATCH
  TOURNAMENT
  TRAINING
  SOCIAL
  MEETING
}

enum NotificationType {
  SYSTEM
  MATCH
  TEAM
  MESSAGE
  ACHIEVEMENT
  ALERT
}

enum ListingStatus {
  DRAFT
  ACTIVE
  SOLD
  EXPIRED
  REMOVED
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  PASSWORD_CHANGE
  ROLE_CHANGE
  STATUS_CHANGE
}
```

### 4.3 Entità Organizzative (Multi-Org Hierarchy)

```prisma
// ============================================================================
// MULTI-ORGANIZATION HIERARCHY
// ============================================================================

model Federation {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(200)
  code        String   @unique @db.VarChar(20)
  country     String   @db.VarChar(100)
  logo        String?  @db.VarChar(500)
  website     String?  @db.VarChar(500)
  email       String   @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  regulations String?  @db.Text
  settings    Json     @default("{}")
  isActive    Boolean  @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  createdBy String?   @map("created_by") @db.Uuid
  updatedBy String?   @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by") @db.Uuid

  // Relations
  organizations        Organization[]
  seasons              Season[]
  membershipTiers      MembershipTier[]
  refereeCertifications RefereeCertification[]

  // Reverse relations (entità che referenziano federation)
  users                User[]
  teams                Team[]
  fields               Field[]
  matches              Match[]
  shops                Shop[]
  events               Event[]

  @@index([code])
  @@index([isActive])
  @@index([deletedAt])
  @@map("federations")
}

model Organization {
  id           String   @id @default(uuid()) @db.Uuid
  federationId String   @map("federation_id") @db.Uuid
  name         String   @db.VarChar(200)
  code         String   @unique @db.VarChar(20)
  region       String   @db.VarChar(100)
  province     String?  @db.VarChar(100)
  address      String?  @db.VarChar(500)
  logo         String?  @db.VarChar(500)
  email        String   @db.VarChar(255)
  phone        String?  @db.VarChar(50)
  settings     Json     @default("{}")
  isActive     Boolean  @default(true) @map("is_active")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  createdBy String?   @map("created_by") @db.Uuid
  updatedBy String?   @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by") @db.Uuid

  // Relations
  federation  Federation  @relation(fields: [federationId], references: [id])
  divisions   Division[]
  memberships Membership[]

  // Reverse relations
  users       User[]
  teams       Team[]
  fields      Field[]
  matches     Match[]
  shops       Shop[]
  events      Event[]

  @@index([federationId])
  @@index([code])
  @@index([region])
  @@index([isActive])
  @@index([deletedAt])
  @@map("organizations")
}

model Division {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  federationId   String   @map("federation_id") @db.Uuid
  name           String   @db.VarChar(200)
  code           String   @db.VarChar(20)
  area           String?  @db.VarChar(200)
  managerId      String?  @map("manager_id") @db.Uuid
  isDefault      Boolean  @default(false) @map("is_default")
  isActive       Boolean  @default(true) @map("is_active")
  settings       Json     @default("{}")

  // Audit
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  createdBy String?   @map("created_by") @db.Uuid
  updatedBy String?   @map("updated_by") @db.Uuid
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by") @db.Uuid

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  manager      User?        @relation("DivisionManager", fields: [managerId], references: [id])

  // Reverse relations
  users        User[]       @relation("UserDivision")
  teams        Team[]
  fields       Field[]
  matches      Match[]
  shops        Shop[]
  events       Event[]
  playerRankings PlayerRanking[]
  teamRankings   TeamRanking[]

  @@unique([organizationId, code])
  @@index([organizationId])
  @@index([federationId])
  @@index([managerId])
  @@index([isActive])
  @@index([deletedAt])
  @@map("divisions")
}
```

### 4.4 Entità Identity Context (Utenti)

```prisma
// ============================================================================
// IDENTITY CONTEXT
// ============================================================================

model User {
  id             String     @id @default(uuid()) @db.Uuid

  // Multi-org (denormalizzato per query veloci)
  divisionId     String     @map("division_id") @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  federationId   String     @map("federation_id") @db.Uuid

  // Auth
  email          String     @unique @db.VarChar(255)
  username       String     @unique @db.VarChar(50)
  passwordHash   String?    @map("password_hash") @db.VarChar(255)

  // Profile base
  firstName      String?    @map("first_name") @db.VarChar(100)
  lastName       String?    @map("last_name") @db.VarChar(100)
  displayName    String?    @map("display_name") @db.VarChar(100)
  avatarUrl      String?    @map("avatar_url") @db.VarChar(500)
  phone          String?    @db.VarChar(50)
  dateOfBirth    DateTime?  @map("date_of_birth") @db.Date

  // Role & Status
  role           UserRole   @default(PLAYER)
  status         UserStatus @default(PENDING)
  tier           UserTier   @default(FREE)

  // Gaming stats
  elo            Int        @default(1000)
  totalMatches   Int        @default(0) @map("total_matches")
  totalKills     Int        @default(0) @map("total_kills")
  totalDeaths    Int        @default(0) @map("total_deaths")

  // Referee
  refereeLevel   Int?       @map("referee_level")

  // Settings
  settings       Json       @default("{}")
  emailVerified  Boolean    @default(false) @map("email_verified")
  lastLoginAt    DateTime?  @map("last_login_at")

  // Audit
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")
  deletedAt      DateTime?  @map("deleted_at")
  deletedBy      String?    @map("deleted_by") @db.Uuid

  // Relations
  division       Division      @relation("UserDivision", fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])

  profile        UserProfile?
  userSettings   UserSettings?

  // Team relations
  teamMemberships   TeamMember[]
  ledTeams          Team[]           @relation("TeamLeader")

  // Match relations
  organizedMatches  Match[]          @relation("MatchOrganizer")
  refereedMatches   Match[]          @relation("MatchReferee")
  matchParticipations MatchParticipant[]

  // Kill events
  kills             KillEvent[]      @relation("Killer")
  deaths            KillEvent[]      @relation("Victim")

  // Field relations
  ownedFields       Field[]          @relation("FieldOwner")
  fieldReviews      FieldReview[]

  // Commerce
  ownedShops        Shop[]           @relation("ShopOwner")
  marketplaceListings MarketplaceListing[]
  orders            Order[]

  // Communication
  sentMessages      Message[]        @relation("MessageSender")
  notifications     Notification[]
  conversationParticipations ConversationParticipant[]

  // Membership & Rankings
  memberships       Membership[]
  eloHistory        EloHistory[]
  playerRankings    PlayerRanking[]

  // Division management
  managedDivisions  Division[]       @relation("DivisionManager")

  // Referee certification
  refereeCertifications RefereeCertification[]

  // Events
  eventRegistrations EventRegistration[]

  // Audit logs
  auditLogs         AuditLog[]

  @@index([email])
  @@index([username])
  @@index([divisionId])
  @@index([organizationId])
  @@index([federationId])
  @@index([role])
  @@index([status])
  @@index([elo])
  @@index([deletedAt])
  @@index([divisionId, status])
  @@index([role, divisionId])
  @@map("users")
}

model UserProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @map("user_id") @db.Uuid

  bio         String?  @db.Text
  location    String?  @db.VarChar(200)
  website     String?  @db.VarChar(500)

  // Social links
  discordId   String?  @map("discord_id") @db.VarChar(100)
  telegramId  String?  @map("telegram_id") @db.VarChar(100)
  instagramId String?  @map("instagram_id") @db.VarChar(100)

  // Preferences
  preferredGameModes  String[] @map("preferred_game_modes")
  preferredWeapons    String[] @map("preferred_weapons")
  experienceYears     Int?     @map("experience_years")

  // Visibility
  isPublic    Boolean  @default(true) @map("is_public")

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserSettings {
  id                    String   @id @default(uuid()) @db.Uuid
  userId                String   @unique @map("user_id") @db.Uuid

  // Notifications
  emailNotifications    Boolean  @default(true) @map("email_notifications")
  pushNotifications     Boolean  @default(true) @map("push_notifications")
  matchReminders        Boolean  @default(true) @map("match_reminders")
  teamInviteAlerts      Boolean  @default(true) @map("team_invite_alerts")

  // Privacy
  showOnlineStatus      Boolean  @default(true) @map("show_online_status")
  showStats             Boolean  @default(true) @map("show_stats")
  allowDirectMessages   Boolean  @default(true) @map("allow_direct_messages")

  // Display
  language              String   @default("it") @db.VarChar(10)
  timezone              String   @default("Europe/Rome") @db.VarChar(50)
  dateFormat            String   @default("DD/MM/YYYY") @map("date_format") @db.VarChar(20)

  // Audit
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // Relations
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model RefereeCertification {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  federationId  String    @map("federation_id") @db.Uuid

  level         Int       @default(1)
  certifiedAt   DateTime  @map("certified_at")
  expiresAt     DateTime? @map("expires_at")
  certificateNumber String? @unique @map("certificate_number") @db.VarChar(50)

  isActive      Boolean   @default(true) @map("is_active")

  // Audit
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  user          User       @relation(fields: [userId], references: [id])
  federation    Federation @relation(fields: [federationId], references: [id])

  @@unique([userId, federationId])
  @@index([federationId])
  @@index([level])
  @@index([isActive])
  @@map("referee_certifications")
}
```

### 4.5 Entità Community Context (Team)

```prisma
// ============================================================================
// COMMUNITY CONTEXT
// ============================================================================

model Team {
  id             String     @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String     @map("division_id") @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  federationId   String     @map("federation_id") @db.Uuid

  // Identity
  name           String     @db.VarChar(100)
  tag            String     @unique @db.VarChar(10)
  description    String?    @db.Text
  logoUrl        String?    @map("logo_url") @db.VarChar(500)
  bannerUrl      String?    @map("banner_url") @db.VarChar(500)

  // Leadership
  leaderId       String     @map("leader_id") @db.Uuid

  // Status
  status         TeamStatus @default(ACTIVE)
  isRecruiting   Boolean    @default(false) @map("is_recruiting")

  // Requirements
  minElo         Int?       @map("min_elo")
  maxMembers     Int        @default(20) @map("max_members")
  requirements   String?    @db.Text

  // Stats
  totalMatches   Int        @default(0) @map("total_matches")
  wins           Int        @default(0)
  losses         Int        @default(0)
  draws          Int        @default(0)
  elo            Int        @default(1000)

  // Social
  discordInvite  String?    @map("discord_invite") @db.VarChar(200)

  // Audit
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")
  createdBy      String?    @map("created_by") @db.Uuid
  updatedBy      String?    @map("updated_by") @db.Uuid
  deletedAt      DateTime?  @map("deleted_at")
  deletedBy      String?    @map("deleted_by") @db.Uuid

  // Relations
  division       Division      @relation(fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])
  leader         User          @relation("TeamLeader", fields: [leaderId], references: [id])

  members        TeamMember[]
  invites        TeamInvite[]
  matchTeams     MatchTeam[]
  teamRankings   TeamRanking[]

  // Challenges
  sentChallenges     TeamChallenge[] @relation("ChallengerTeam")
  receivedChallenges TeamChallenge[] @relation("ChallengedTeam")

  @@index([tag])
  @@index([divisionId])
  @@index([organizationId])
  @@index([federationId])
  @@index([leaderId])
  @@index([status])
  @@index([isRecruiting])
  @@index([elo])
  @@index([deletedAt])
  @@index([divisionId, status])
  @@index([isRecruiting, divisionId])
  @@map("teams")
}

model TeamMember {
  id        String         @id @default(uuid()) @db.Uuid
  teamId    String         @map("team_id") @db.Uuid
  userId    String         @map("user_id") @db.Uuid

  role      TeamMemberRole @default(MEMBER)
  joinedAt  DateTime       @default(now()) @map("joined_at")
  isActive  Boolean        @default(true) @map("is_active")

  // Stats within team
  matchesPlayed Int        @default(0) @map("matches_played")

  // Audit
  createdAt DateTime       @default(now()) @map("created_at")
  updatedAt DateTime       @updatedAt @map("updated_at")

  // Relations
  team      Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@index([role])
  @@index([isActive])
  @@map("team_members")
}

model TeamInvite {
  id           String    @id @default(uuid()) @db.Uuid
  teamId       String    @map("team_id") @db.Uuid
  invitedEmail String    @map("invited_email") @db.VarChar(255)
  invitedUserId String?  @map("invited_user_id") @db.Uuid

  message      String?   @db.Text
  expiresAt    DateTime  @map("expires_at")
  acceptedAt   DateTime? @map("accepted_at")
  rejectedAt   DateTime? @map("rejected_at")

  // Audit
  createdAt    DateTime  @default(now()) @map("created_at")
  createdBy    String    @map("created_by") @db.Uuid

  // Relations
  team         Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([invitedEmail])
  @@index([invitedUserId])
  @@index([expiresAt])
  @@map("team_invites")
}

model TeamChallenge {
  id              String    @id @default(uuid()) @db.Uuid
  challengerTeamId String   @map("challenger_team_id") @db.Uuid
  challengedTeamId String   @map("challenged_team_id") @db.Uuid

  message         String?   @db.Text
  proposedDate    DateTime? @map("proposed_date")
  proposedFieldId String?   @map("proposed_field_id") @db.Uuid
  gameMode        MatchMode @default(TDM) @map("game_mode")

  status          String    @default("PENDING") @db.VarChar(20) // PENDING, ACCEPTED, REJECTED, EXPIRED
  respondedAt     DateTime? @map("responded_at")
  matchId         String?   @map("match_id") @db.Uuid // Se accettata, link alla partita creata

  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  expiresAt       DateTime  @map("expires_at")

  // Relations
  challengerTeam  Team      @relation("ChallengerTeam", fields: [challengerTeamId], references: [id])
  challengedTeam  Team      @relation("ChallengedTeam", fields: [challengedTeamId], references: [id])

  @@index([challengerTeamId])
  @@index([challengedTeamId])
  @@index([status])
  @@index([expiresAt])
  @@map("team_challenges")
}
```

### 4.6 Entità Location Context (Campi)

```prisma
// ============================================================================
// LOCATION CONTEXT
// ============================================================================

model Field {
  id             String      @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String      @map("division_id") @db.Uuid
  organizationId String      @map("organization_id") @db.Uuid
  federationId   String      @map("federation_id") @db.Uuid

  // Ownership
  ownerId        String      @map("owner_id") @db.Uuid

  // Identity
  name           String      @db.VarChar(200)
  slug           String      @unique @db.VarChar(100)
  description    String?     @db.Text

  // Location
  address        String      @db.VarChar(500)
  city           String      @db.VarChar(100)
  province       String      @db.VarChar(100)
  postalCode     String?     @map("postal_code") @db.VarChar(20)
  country        String      @default("IT") @db.VarChar(2)
  latitude       Decimal?    @db.Decimal(10, 8)
  longitude      Decimal?    @db.Decimal(11, 8)

  // Characteristics
  type           FieldType   @default(OUTDOOR)
  status         FieldStatus @default(PENDING)
  totalArea      Int?        @map("total_area") // metri quadri
  playableArea   Int?        @map("playable_area")
  maxPlayers     Int         @default(50) @map("max_players")
  minPlayers     Int         @default(10) @map("min_players")

  // Media
  coverImageUrl  String?     @map("cover_image_url") @db.VarChar(500)
  images         String[]    @default([])

  // Facilities (JSON per flessibilità)
  facilities     Json        @default("{}") // parking, showers, rental, etc.

  // Pricing
  pricing        Json        @default("{}") // daily, hourly, per-player rates

  // Contact
  email          String?     @db.VarChar(255)
  phone          String?     @db.VarChar(50)
  website        String?     @db.VarChar(500)

  // Stats
  totalMatches   Int         @default(0) @map("total_matches")
  avgRating      Decimal     @default(0) @map("avg_rating") @db.Decimal(3, 2)
  reviewCount    Int         @default(0) @map("review_count")

  // Audit
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  createdBy      String?     @map("created_by") @db.Uuid
  updatedBy      String?     @map("updated_by") @db.Uuid
  deletedAt      DateTime?   @map("deleted_at")
  deletedBy      String?     @map("deleted_by") @db.Uuid

  // Relations
  division       Division      @relation(fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])
  owner          User          @relation("FieldOwner", fields: [ownerId], references: [id])

  reviews        FieldReview[]
  schedules      FieldSchedule[]
  matches        Match[]
  events         Event[]
  maps           FieldMap[]

  @@index([slug])
  @@index([divisionId])
  @@index([organizationId])
  @@index([federationId])
  @@index([ownerId])
  @@index([type])
  @@index([status])
  @@index([city])
  @@index([province])
  @@index([avgRating])
  @@index([deletedAt])
  @@index([latitude, longitude])
  @@map("fields")
}

model FieldReview {
  id          String   @id @default(uuid()) @db.Uuid
  fieldId     String   @map("field_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid

  rating      Int      // 1-5
  title       String?  @db.VarChar(200)
  content     String?  @db.Text

  // Detailed ratings
  facilityRating   Int? @map("facility_rating")
  locationRating   Int? @map("location_rating")
  valueRating      Int? @map("value_rating")

  isVerified  Boolean  @default(false) @map("is_verified") // Verified visit

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  field       Field    @relation(fields: [fieldId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@unique([fieldId, userId]) // Un utente può recensire un campo una sola volta
  @@index([fieldId])
  @@index([userId])
  @@index([rating])
  @@index([deletedAt])
  @@map("field_reviews")
}

model FieldSchedule {
  id          String    @id @default(uuid()) @db.Uuid
  fieldId     String    @map("field_id") @db.Uuid

  dayOfWeek   Int       @map("day_of_week") // 0-6, Sunday-Saturday
  openTime    String    @map("open_time") @db.VarChar(5) // HH:MM
  closeTime   String    @map("close_time") @db.VarChar(5)
  isOpen      Boolean   @default(true) @map("is_open")

  // Override per date specifiche
  specificDate DateTime? @map("specific_date") @db.Date
  note         String?   @db.VarChar(500)

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  field       Field     @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([fieldId])
  @@index([dayOfWeek])
  @@index([specificDate])
  @@map("field_schedules")
}

model FieldMap {
  id          String   @id @default(uuid()) @db.Uuid
  fieldId     String   @map("field_id") @db.Uuid

  name        String   @db.VarChar(100)
  description String?  @db.Text
  mapData     Json     @map("map_data") // JSON della mappa tattica
  thumbnail   String?  @db.VarChar(500)

  isActive    Boolean  @default(true) @map("is_active")
  isDefault   Boolean  @default(false) @map("is_default")

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdBy   String?  @map("created_by") @db.Uuid

  // Relations
  field       Field    @relation(fields: [fieldId], references: [id], onDelete: Cascade)

  @@index([fieldId])
  @@index([isActive])
  @@map("field_maps")
}
```

### 4.7 Entità Gameplay Context (Partite)

```prisma
// ============================================================================
// GAMEPLAY CONTEXT
// ============================================================================

model Match {
  id             String      @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String      @map("division_id") @db.Uuid
  organizationId String      @map("organization_id") @db.Uuid
  federationId   String      @map("federation_id") @db.Uuid

  // References
  fieldId        String      @map("field_id") @db.Uuid
  organizerId    String      @map("organizer_id") @db.Uuid
  refereeId      String?     @map("referee_id") @db.Uuid

  // Identity
  name           String      @db.VarChar(200)
  description    String?     @db.Text

  // Game settings
  mode           MatchMode   @default(TDM)
  status         MatchStatus @default(DRAFT)
  settings       Json        @default("{}") // Round time, respawn rules, etc.

  // Scheduling
  scheduledAt    DateTime    @map("scheduled_at")
  duration       Int         @default(180) // minuti previsti
  checkInStart   DateTime?   @map("check_in_start")
  checkInEnd     DateTime?   @map("check_in_end")

  // Actual timing
  startedAt      DateTime?   @map("started_at")
  endedAt        DateTime?   @map("ended_at")

  // Capacity
  maxPlayers     Int         @default(40) @map("max_players")
  minPlayers     Int         @default(10) @map("min_players")
  maxTeams       Int         @default(2) @map("max_teams")

  // Registration
  isPublic       Boolean     @default(true) @map("is_public")
  requiresApproval Boolean   @default(false) @map("requires_approval")
  entryFee       Decimal?    @map("entry_fee") @db.Decimal(10, 2)

  // Results
  winnerTeamId   String?     @map("winner_team_id") @db.Uuid
  isTie          Boolean     @default(false) @map("is_tie")

  // Audit
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  createdBy      String?     @map("created_by") @db.Uuid
  updatedBy      String?     @map("updated_by") @db.Uuid
  deletedAt      DateTime?   @map("deleted_at")
  deletedBy      String?     @map("deleted_by") @db.Uuid

  // Relations
  division       Division      @relation(fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])
  field          Field         @relation(fields: [fieldId], references: [id])
  organizer      User          @relation("MatchOrganizer", fields: [organizerId], references: [id])
  referee        User?         @relation("MatchReferee", fields: [refereeId], references: [id])

  teams          MatchTeam[]
  participants   MatchParticipant[]
  rounds         Round[]

  @@unique([fieldId, scheduledAt]) // No due partite stesso campo/ora
  @@index([divisionId])
  @@index([organizationId])
  @@index([federationId])
  @@index([fieldId])
  @@index([organizerId])
  @@index([refereeId])
  @@index([status])
  @@index([mode])
  @@index([scheduledAt])
  @@index([deletedAt])
  @@index([divisionId, scheduledAt(sort: Desc)])
  @@index([status, divisionId])
  @@index([scheduledAt, status])
  @@map("matches")
}

model MatchTeam {
  id          String  @id @default(uuid()) @db.Uuid
  matchId     String  @map("match_id") @db.Uuid
  teamId      String  @map("team_id") @db.Uuid

  slot        Int     // 0, 1, 2... posizione nel match
  color       String? @db.VarChar(7) // Hex color per UI
  spawnPoint  String? @map("spawn_point") @db.VarChar(50)

  // Scores
  score       Int     @default(0)
  kills       Int     @default(0)
  deaths      Int     @default(0)
  objectives  Int     @default(0)

  // Status
  isWinner    Boolean @default(false) @map("is_winner")

  // Audit
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  match       Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  team        Team     @relation(fields: [teamId], references: [id])

  objectiveEvents ObjectiveEvent[]

  @@unique([matchId, teamId])
  @@unique([matchId, slot])
  @@index([matchId])
  @@index([teamId])
  @@map("match_teams")
}

model MatchParticipant {
  id          String    @id @default(uuid()) @db.Uuid
  matchId     String    @map("match_id") @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  teamSlot    Int?      @map("team_slot") // Quale team nel match

  // Status
  status      String    @default("REGISTERED") @db.VarChar(20) // REGISTERED, CHECKED_IN, PLAYING, LEFT, EJECTED
  checkedInAt DateTime? @map("checked_in_at")

  // Stats
  kills       Int       @default(0)
  deaths      Int       @default(0)
  assists     Int       @default(0)
  objectives  Int       @default(0)
  score       Int       @default(0)

  // ELO impact
  eloBefore   Int?      @map("elo_before")
  eloAfter    Int?      @map("elo_after")
  eloChange   Int?      @map("elo_change")

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  match       Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])

  @@unique([matchId, userId])
  @@index([matchId])
  @@index([userId])
  @@index([status])
  @@map("match_participants")
}

model Round {
  id            String      @id @default(uuid()) @db.Uuid
  matchId       String      @map("match_id") @db.Uuid

  roundNumber   Int         @map("round_number")
  status        RoundStatus @default(PENDING)

  startedAt     DateTime?   @map("started_at")
  endedAt       DateTime?   @map("ended_at")
  duration      Int?        // secondi effettivi

  // Winner
  winnerSlot    Int?        @map("winner_slot")
  winCondition  String?     @map("win_condition") @db.VarChar(50) // TIME, ELIMINATION, OBJECTIVE

  // Audit
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  // Relations
  match         Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)

  killEvents    KillEvent[]
  objectiveEvents ObjectiveEvent[]

  @@unique([matchId, roundNumber])
  @@index([matchId])
  @@index([status])
  @@map("rounds")
}

model KillEvent {
  id          String   @id @default(uuid()) @db.Uuid
  roundId     String   @map("round_id") @db.Uuid

  killerId    String   @map("killer_id") @db.Uuid
  victimId    String   @map("victim_id") @db.Uuid

  timestamp   DateTime @default(now())

  // Position (per replay/heatmap)
  positionX   Decimal? @map("position_x") @db.Decimal(10, 4)
  positionY   Decimal? @map("position_y") @db.Decimal(10, 4)

  // Metadata
  weapon      String?  @db.VarChar(100)
  distance    Decimal? @db.Decimal(8, 2) // metri
  isHeadshot  Boolean  @default(false) @map("is_headshot")

  // Validation
  isVerified  Boolean  @default(false) @map("is_verified")
  verifiedBy  String?  @map("verified_by") @db.Uuid

  // Relations
  round       Round    @relation(fields: [roundId], references: [id], onDelete: Cascade)
  killer      User     @relation("Killer", fields: [killerId], references: [id])
  victim      User     @relation("Victim", fields: [victimId], references: [id])

  @@index([roundId])
  @@index([killerId])
  @@index([victimId])
  @@index([timestamp])
  @@map("kill_events")
}

model ObjectiveEvent {
  id          String   @id @default(uuid()) @db.Uuid
  roundId     String   @map("round_id") @db.Uuid
  matchTeamId String   @map("match_team_id") @db.Uuid

  type        String   @db.VarChar(50) // FLAG_CAPTURE, BOMB_PLANT, ZONE_CAPTURE, etc.
  timestamp   DateTime @default(now())
  points      Int      @default(1)

  // Position
  positionX   Decimal? @map("position_x") @db.Decimal(10, 4)
  positionY   Decimal? @map("position_y") @db.Decimal(10, 4)

  // Metadata
  metadata    Json     @default("{}")

  // Relations
  round       Round     @relation(fields: [roundId], references: [id], onDelete: Cascade)
  matchTeam   MatchTeam @relation(fields: [matchTeamId], references: [id])

  @@index([roundId])
  @@index([matchTeamId])
  @@index([type])
  @@index([timestamp])
  @@map("objective_events")
}
```

### 4.8 Entità Ranking e Membership

```prisma
// ============================================================================
// RANKING & MEMBERSHIP CONTEXT
// ============================================================================

model Season {
  id           String    @id @default(uuid()) @db.Uuid
  federationId String    @map("federation_id") @db.Uuid

  name         String    @db.VarChar(100)
  startDate    DateTime  @map("start_date") @db.Date
  endDate      DateTime  @map("end_date") @db.Date

  isActive     Boolean   @default(false) @map("is_active")
  isCurrent    Boolean   @default(false) @map("is_current")

  settings     Json      @default("{}") // ELO multipliers, decay rules, etc.

  // Audit
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  federation   Federation @relation(fields: [federationId], references: [id])

  playerRankings PlayerRanking[]
  teamRankings   TeamRanking[]

  @@unique([federationId, name])
  @@index([federationId])
  @@index([isActive])
  @@index([isCurrent])
  @@map("seasons")
}

model PlayerRanking {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  divisionId   String   @map("division_id") @db.Uuid
  seasonId     String   @map("season_id") @db.Uuid

  elo          Int      @default(1000)
  rank         Int?     // Posizione in classifica
  tier         String?  @db.VarChar(20) // BRONZE, SILVER, GOLD, etc.

  // Stats stagionali
  matchesPlayed Int     @default(0) @map("matches_played")
  wins          Int     @default(0)
  losses        Int     @default(0)
  kills         Int     @default(0)
  deaths        Int     @default(0)

  // Calculated
  winRate       Decimal  @default(0) @map("win_rate") @db.Decimal(5, 2)
  kdr           Decimal  @default(0) @db.Decimal(6, 3)

  // Audit
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  user         User     @relation(fields: [userId], references: [id])
  division     Division @relation(fields: [divisionId], references: [id])
  season       Season   @relation(fields: [seasonId], references: [id])

  @@unique([userId, divisionId, seasonId])
  @@index([divisionId])
  @@index([seasonId])
  @@index([elo(sort: Desc)])
  @@index([rank])
  @@map("player_rankings")
}

model TeamRanking {
  id           String   @id @default(uuid()) @db.Uuid
  teamId       String   @map("team_id") @db.Uuid
  divisionId   String   @map("division_id") @db.Uuid
  seasonId     String   @map("season_id") @db.Uuid

  elo          Int      @default(1000)
  rank         Int?

  // Stats
  matchesPlayed Int     @default(0) @map("matches_played")
  wins          Int     @default(0)
  losses        Int     @default(0)
  draws         Int     @default(0)

  winRate       Decimal  @default(0) @map("win_rate") @db.Decimal(5, 2)

  // Audit
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  team         Team     @relation(fields: [teamId], references: [id])
  division     Division @relation(fields: [divisionId], references: [id])
  season       Season   @relation(fields: [seasonId], references: [id])

  @@unique([teamId, divisionId, seasonId])
  @@index([divisionId])
  @@index([seasonId])
  @@index([elo(sort: Desc)])
  @@index([rank])
  @@map("team_rankings")
}

model EloHistory {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  matchId     String?  @map("match_id") @db.Uuid

  previousElo Int      @map("previous_elo")
  newElo      Int      @map("new_elo")
  change      Int
  reason      String   @db.VarChar(100) // MATCH_WIN, MATCH_LOSS, DECAY, ADJUSTMENT

  timestamp   DateTime @default(now())

  // Relations
  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([matchId])
  @@index([timestamp])
  @@map("elo_history")
}

model MembershipTier {
  id            String   @id @default(uuid()) @db.Uuid
  federationId  String   @map("federation_id") @db.Uuid

  name          String   @db.VarChar(50)
  code          String   @db.VarChar(20)
  price         Decimal  @db.Decimal(10, 2)
  currency      String   @default("EUR") @db.VarChar(3)
  duration      Int      // giorni

  // Benefits (JSON per flessibilità)
  benefits      Json     @default("{}")

  isActive      Boolean  @default(true) @map("is_active")
  sortOrder     Int      @default(0) @map("sort_order")

  // Audit
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  federation    Federation @relation(fields: [federationId], references: [id])
  memberships   Membership[]

  @@unique([federationId, code])
  @@index([federationId])
  @@index([isActive])
  @@map("membership_tiers")
}

model Membership {
  id              String           @id @default(uuid()) @db.Uuid
  userId          String           @map("user_id") @db.Uuid
  organizationId  String           @map("organization_id") @db.Uuid
  tierId          String           @map("tier_id") @db.Uuid

  memberNumber    String?          @unique @map("member_number") @db.VarChar(50)
  status          MembershipStatus @default(PENDING)

  startDate       DateTime         @map("start_date") @db.Date
  endDate         DateTime         @map("end_date") @db.Date
  renewedAt       DateTime?        @map("renewed_at")

  // Audit
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  // Relations
  user            User             @relation(fields: [userId], references: [id])
  organization    Organization     @relation(fields: [organizationId], references: [id])
  tier            MembershipTier   @relation(fields: [tierId], references: [id])

  payments        MembershipPayment[]

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@index([tierId])
  @@index([status])
  @@index([endDate])
  @@map("memberships")
}

model MembershipPayment {
  id           String        @id @default(uuid()) @db.Uuid
  membershipId String        @map("membership_id") @db.Uuid

  amount       Decimal       @db.Decimal(10, 2)
  currency     String        @default("EUR") @db.VarChar(3)
  status       PaymentStatus @default(PENDING)

  // Payment provider
  provider     String?       @db.VarChar(50) // stripe, paypal, manual
  externalId   String?       @map("external_id") @db.VarChar(200)

  paidAt       DateTime?     @map("paid_at")

  // Audit
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  // Relations
  membership   Membership    @relation(fields: [membershipId], references: [id])

  @@index([membershipId])
  @@index([status])
  @@index([externalId])
  @@map("membership_payments")
}
```

### 4.9 Entità Calendar, Commerce e Communication

```prisma
// ============================================================================
// CALENDAR CONTEXT
// ============================================================================

model Event {
  id             String    @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String    @map("division_id") @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  federationId   String    @map("federation_id") @db.Uuid

  fieldId        String?   @map("field_id") @db.Uuid
  organizerId    String    @map("organizer_id") @db.Uuid

  // Identity
  name           String    @db.VarChar(200)
  description    String?   @db.Text
  type           EventType @default(MATCH)

  // Scheduling
  startDate      DateTime  @map("start_date")
  endDate        DateTime  @map("end_date")

  // Capacity
  maxParticipants Int?     @map("max_participants")

  // Registration
  isPublic       Boolean   @default(true) @map("is_public")
  registrationDeadline DateTime? @map("registration_deadline")

  // Status
  isCancelled    Boolean   @default(false) @map("is_cancelled")

  // Audit
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  // Relations
  division       Division      @relation(fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])
  field          Field?        @relation(fields: [fieldId], references: [id])

  registrations  EventRegistration[]

  @@index([divisionId])
  @@index([organizationId])
  @@index([fieldId])
  @@index([type])
  @@index([startDate])
  @@index([deletedAt])
  @@map("events")
}

model EventRegistration {
  id          String    @id @default(uuid()) @db.Uuid
  eventId     String    @map("event_id") @db.Uuid
  userId      String    @map("user_id") @db.Uuid

  status      String    @default("REGISTERED") @db.VarChar(20)
  notes       String?   @db.Text

  registeredAt DateTime @default(now()) @map("registered_at")
  cancelledAt  DateTime? @map("cancelled_at")

  // Relations
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
  @@map("event_registrations")
}

// ============================================================================
// COMMERCE CONTEXT
// ============================================================================

model Shop {
  id             String   @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String   @map("division_id") @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  federationId   String   @map("federation_id") @db.Uuid

  ownerId        String   @map("owner_id") @db.Uuid

  // Identity
  name           String   @db.VarChar(200)
  slug           String   @unique @db.VarChar(100)
  description    String?  @db.Text
  logoUrl        String?  @map("logo_url") @db.VarChar(500)

  // Location
  address        String?  @db.VarChar(500)
  city           String?  @db.VarChar(100)

  // Contact
  email          String?  @db.VarChar(255)
  phone          String?  @db.VarChar(50)
  website        String?  @db.VarChar(500)

  // Status
  isActive       Boolean  @default(true) @map("is_active")
  isVerified     Boolean  @default(false) @map("is_verified")

  // Audit
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  // Relations
  division       Division      @relation(fields: [divisionId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id])
  federation     Federation    @relation(fields: [federationId], references: [id])
  owner          User          @relation("ShopOwner", fields: [ownerId], references: [id])

  products       Product[]
  orders         Order[]

  @@index([slug])
  @@index([divisionId])
  @@index([ownerId])
  @@index([isActive])
  @@index([deletedAt])
  @@map("shops")
}

model ProductCategory {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(100)
  slug        String    @unique @db.VarChar(100)
  parentId    String?   @map("parent_id") @db.Uuid
  sortOrder   Int       @default(0) @map("sort_order")

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  parent      ProductCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    ProductCategory[] @relation("CategoryHierarchy")
  products    Product[]

  @@index([parentId])
  @@index([slug])
  @@map("product_categories")
}

model Product {
  id          String   @id @default(uuid()) @db.Uuid
  shopId      String   @map("shop_id") @db.Uuid
  categoryId  String?  @map("category_id") @db.Uuid

  name        String   @db.VarChar(200)
  description String?  @db.Text
  sku         String?  @db.VarChar(50)

  price       Decimal  @db.Decimal(10, 2)
  currency    String   @default("EUR") @db.VarChar(3)

  // Inventory
  stock       Int      @default(0)
  isAvailable Boolean  @default(true) @map("is_available")

  // Media
  images      String[] @default([])

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  shop        Shop             @relation(fields: [shopId], references: [id])
  category    ProductCategory? @relation(fields: [categoryId], references: [id])

  @@index([shopId])
  @@index([categoryId])
  @@index([sku])
  @@index([isAvailable])
  @@index([deletedAt])
  @@map("products")
}

model MarketplaceListing {
  id             String        @id @default(uuid()) @db.Uuid

  // Multi-org
  divisionId     String        @map("division_id") @db.Uuid

  sellerId       String        @map("seller_id") @db.Uuid

  title          String        @db.VarChar(200)
  description    String        @db.Text

  price          Decimal       @db.Decimal(10, 2)
  currency       String        @default("EUR") @db.VarChar(3)

  condition      String        @db.VarChar(20) // NEW, LIKE_NEW, GOOD, FAIR

  status         ListingStatus @default(DRAFT)

  // Media
  images         String[]      @default([])

  // Location
  city           String?       @db.VarChar(100)

  // Expiry
  expiresAt      DateTime?     @map("expires_at")

  // Audit
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")
  deletedAt      DateTime?     @map("deleted_at")

  // Relations
  seller         User          @relation(fields: [sellerId], references: [id])

  @@index([divisionId])
  @@index([sellerId])
  @@index([status])
  @@index([expiresAt])
  @@index([deletedAt])
  @@map("marketplace_listings")
}

model Order {
  id          String        @id @default(uuid()) @db.Uuid
  shopId      String        @map("shop_id") @db.Uuid
  buyerId     String        @map("buyer_id") @db.Uuid

  status      String        @default("PENDING") @db.VarChar(20)

  totalAmount Decimal       @map("total_amount") @db.Decimal(10, 2)
  currency    String        @default("EUR") @db.VarChar(3)

  // Shipping
  shippingAddress Json?     @map("shipping_address")

  // Payment
  paymentStatus PaymentStatus @default(PENDING) @map("payment_status")
  paidAt        DateTime?     @map("paid_at")

  // Audit
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  // Relations
  shop        Shop          @relation(fields: [shopId], references: [id])
  buyer       User          @relation(fields: [buyerId], references: [id])

  @@index([shopId])
  @@index([buyerId])
  @@index([status])
  @@index([paymentStatus])
  @@map("orders")
}

// ============================================================================
// COMMUNICATION CONTEXT
// ============================================================================

model Conversation {
  id          String    @id @default(uuid()) @db.Uuid

  type        String    @default("DIRECT") @db.VarChar(20) // DIRECT, GROUP, TEAM
  name        String?   @db.VarChar(100)

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  participants ConversationParticipant[]
  messages     Message[]

  @@map("conversations")
}

model ConversationParticipant {
  id              String    @id @default(uuid()) @db.Uuid
  conversationId  String    @map("conversation_id") @db.Uuid
  userId          String    @map("user_id") @db.Uuid

  lastReadAt      DateTime? @map("last_read_at")
  isMuted         Boolean   @default(false) @map("is_muted")

  joinedAt        DateTime  @default(now()) @map("joined_at")
  leftAt          DateTime? @map("left_at")

  // Relations
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user            User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
  @@index([conversationId])
  @@index([userId])
  @@map("conversation_participants")
}

model Message {
  id              String    @id @default(uuid()) @db.Uuid
  conversationId  String    @map("conversation_id") @db.Uuid
  senderId        String    @map("sender_id") @db.Uuid

  content         String    @db.Text

  // Media
  attachments     Json?     // [{type, url, name}]

  // Status
  isEdited        Boolean   @default(false) @map("is_edited")
  editedAt        DateTime? @map("edited_at")

  // Audit
  createdAt       DateTime  @default(now()) @map("created_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relations
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender          User         @relation("MessageSender", fields: [senderId], references: [id])

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
  @@index([deletedAt])
  @@map("messages")
}

model Notification {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @map("user_id") @db.Uuid

  type        NotificationType @default(SYSTEM)
  title       String           @db.VarChar(200)
  body        String           @db.Text

  // Action
  actionUrl   String?          @map("action_url") @db.VarChar(500)

  // Status
  isRead      Boolean          @default(false) @map("is_read")
  readAt      DateTime?        @map("read_at")

  // Delivery
  emailSent   Boolean          @default(false) @map("email_sent")
  pushSent    Boolean          @default(false) @map("push_sent")

  // Audit
  createdAt   DateTime         @default(now()) @map("created_at")
  expiresAt   DateTime?        @map("expires_at")

  // Relations
  user        User             @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
  @@index([userId, isRead])
  @@map("notifications")
}

// ============================================================================
// ADMINISTRATION CONTEXT
// ============================================================================

model AuditLog {
  id          String      @id @default(uuid()) @db.Uuid
  userId      String?     @map("user_id") @db.Uuid

  action      AuditAction
  entityType  String      @map("entity_type") @db.VarChar(50)
  entityId    String?     @map("entity_id") @db.Uuid

  // Change details
  previousData Json?      @map("previous_data")
  newData      Json?      @map("new_data")

  // Context
  ipAddress   String?     @map("ip_address") @db.VarChar(45)
  userAgent   String?     @map("user_agent") @db.VarChar(500)

  // Audit
  createdAt   DateTime    @default(now()) @map("created_at")

  // Relations
  user        User?       @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([entityId])
  @@index([createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}

model SystemSetting {
  id          String    @id @default(uuid()) @db.Uuid

  // Scope
  scope       String    @db.VarChar(20) // GLOBAL, FEDERATION, ORGANIZATION
  scopeId     String?   @map("scope_id") @db.Uuid

  key         String    @db.VarChar(100)
  value       Json

  description String?   @db.Text

  // Audit
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@unique([scope, scopeId, key])
  @@index([scope])
  @@index([key])
  @@map("system_settings")
}

// ============================================================================
// POSTGRATOR SYSTEM TABLE (IGNORE)
// ============================================================================

model versions {
  version BigInt    @id
  name    String?
  md5     String?
  run_at  DateTime? @db.Timestamptz(6)

  @@ignore
}
```

---

## 5. Indici e Ottimizzazioni

### 5.1 Indici per Pattern di Query Frequenti

| Pattern          | Tabella           | Indice                               | Note                             |
| ---------------- | ----------------- | ------------------------------------ | -------------------------------- |
| Dashboard utente | `matches`         | `(division_id, scheduled_at DESC)`   | Prossime partite della divisione |
| Ricerca campi    | `fields`          | `(latitude, longitude)`              | Query geospaziali                |
| Classifica       | `player_rankings` | `(division_id, elo DESC)`            | Top giocatori                    |
| Calendario       | `events`          | `(start_date, division_id)`          | Eventi futuri                    |
| Soft delete      | Tutte             | `(deleted_at)`                       | Filtro record attivi             |
| Multi-org        | Tutte             | `(division_id)`, `(organization_id)` | RLS filtering                    |

### 5.2 Indici Unique per Business Logic

| Constraint                    | Tabella         | Colonne                    | Scopo                     |
| ----------------------------- | --------------- | -------------------------- | ------------------------- |
| Email unica                   | `users`         | `(email)`                  | Login                     |
| Username unico                | `users`         | `(username)`               | Display                   |
| Tag team unico                | `teams`         | `(tag)`                    | Identificazione rapida    |
| Codice divisione              | `divisions`     | `(organization_id, code)`  | Unicità per org           |
| Una partita per campo/slot    | `matches`       | `(field_id, scheduled_at)` | No sovrapposizioni        |
| Un membro per team/user       | `team_members`  | `(team_id, user_id)`       | No duplicati              |
| Una recensione per campo/user | `field_reviews` | `(field_id, user_id)`      | Una recensione per utente |

### 5.3 Considerazioni Performance

Per tabelle ad alto volume (KillEvent, AuditLog, EloHistory):

```sql
-- Partizionamento per data (da implementare in migrazione raw)
CREATE TABLE kill_events (
  -- ... colonne ...
) PARTITION BY RANGE (timestamp);

-- Partizioni mensili
CREATE TABLE kill_events_2025_01 PARTITION OF kill_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 6. Note Implementative

### 6.1 Soft Delete Query Filter

In ogni query Prisma, aggiungere automaticamente il filtro soft delete:

```typescript
// middleware/soft-delete.ts
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }
  return next(params);
});
```

### 6.2 Audit Automatico

Popolare automaticamente campi audit:

```typescript
prisma.$use(async (params, next) => {
  const userId = getCurrentUserId(); // Da request context

  if (params.action === 'create') {
    params.args.data.createdBy = userId;
    params.args.data.updatedBy = userId;
  }

  if (params.action === 'update') {
    params.args.data.updatedBy = userId;
  }

  return next(params);
});
```

### 6.3 Multi-Org Auto-Population

Per nuove entità, popolare automaticamente la gerarchia organizzativa:

```typescript
async function createWithOrgContext<T>(
  model: string,
  data: Omit<T, 'divisionId' | 'organizationId' | 'federationId'>,
  division: Division
): Promise<T> {
  return prisma[model].create({
    data: {
      ...data,
      divisionId: division.id,
      organizationId: division.organizationId,
      federationId: division.federationId,
    },
  });
}
```

---

## Changelog

| Versione | Data     | Modifiche                |
| -------- | -------- | ------------------------ |
| 1.0      | Dic 2024 | Schema iniziale completo |
