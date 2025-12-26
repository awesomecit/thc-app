# 🎯 TicOps Backend - Requisiti e Specifiche

> Documento di requisiti per sviluppo backend con agenti AI (Copilot/Claude)
> Versione: 1.0 | Data: Dicembre 2024

---

## 📋 INDICE

1. [Overview Architetturale](#1-overview-architetturale)
2. [Domini e Bounded Contexts](#2-domini-e-bounded-contexts)
3. [Entità e Schemi Dati](#3-entità-e-schemi-dati)
4. [API Specification](#4-api-specification)
5. [Autenticazione e Autorizzazione](#5-autenticazione-e-autorizzazione)
6. [Real-time e WebSocket](#6-real-time-e-websocket)
7. [Business Rules](#7-business-rules)
8. [BDD Features](#8-bdd-features)
9. [Diagrammi di Flusso](#9-diagrammi-di-flusso)
10. [Non-Functional Requirements](#10-non-functional-requirements)

---

# 1. OVERVIEW ARCHITETTURALE

## 1.1 Stack Tecnologico Raccomandato

| Layer | Tecnologia | Motivazione |
|-------|------------|-------------|
| Runtime | Node.js 20+ | Ecosistema, performance async |
| Framework | NestJS | Architettura modulare, DI, TypeScript native |
| ORM | Prisma / TypeORM | Type-safety, migrations |
| Database | PostgreSQL 15+ | JSONB, full-text search, GIS |
| Cache | Redis | Session, rate limiting, pub/sub |
| Real-time | Socket.io | WebSocket con fallback |
| Queue | BullMQ | Job processing, scheduled tasks |
| Search | Meilisearch / Elasticsearch | Full-text search campi, utenti |
| Storage | S3-compatible | Immagini, documenti |
| Auth | JWT + Refresh Token | Stateless, scalabile |

## 1.2 Architettura di Riferimento

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│         Web App │ Mobile App │ Admin Dashboard │ Third Party            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      API GATEWAY        │
                    │  Rate Limit │ Auth      │
                    │  Logging │ Validation   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────────┐
        │                        │                            │
        ▼                        ▼                            ▼
┌───────────────┐      ┌─────────────────┐         ┌─────────────────┐
│  REST API     │      │  WebSocket      │         │  Background     │
│  Controllers  │      │  Gateway        │         │  Jobs           │
└───────┬───────┘      └────────┬────────┘         └────────┬────────┘
        │                       │                           │
        └───────────────────────┼───────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    SERVICE LAYER      │
                    │  Business Logic       │
                    │  Domain Events        │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────────┐
        │                       │                           │
        ▼                       ▼                           ▼
┌───────────────┐      ┌─────────────────┐         ┌─────────────────┐
│  PostgreSQL   │      │     Redis       │         │   S3 Storage    │
│  Primary DB   │      │  Cache/PubSub   │         │   Files         │
└───────────────┘      └─────────────────┘         └─────────────────┘
```

## 1.3 Struttura Moduli

```
src/
├── modules/
│   ├── auth/           # Autenticazione, JWT, OAuth
│   ├── users/          # Gestione utenti, profili
│   ├── teams/          # Team, membri, richieste
│   ├── fields/         # Campi, recensioni, booking
│   ├── matches/        # Partite, gameplay, scoring
│   ├── rankings/       # ELO, classifiche, tier
│   ├── chat/           # Messaggi, conversazioni
│   ├── notifications/  # Push, email, inbox
│   ├── referees/       # Patentini, certificazioni
│   ├── admin/          # Pannello amministrazione
│   └── analytics/      # Statistiche, report
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   ├── storage/
│   └── websocket/
└── shared/
    ├── dto/
    ├── entities/
    ├── events/
    └── utils/
```

---

# 2. DOMINI E BOUNDED CONTEXTS

## 2.1 Domain Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TICOPS DOMAIN MAP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   IDENTITY       │    │   COMMUNITY      │    │   GAMEPLAY       │   │
│  │   CONTEXT        │    │   CONTEXT        │    │   CONTEXT        │   │
│  │                  │    │                  │    │                  │   │
│  │  • User          │◄──►│  • Team          │◄──►│  • Match         │   │
│  │  • Profile       │    │  • Membership    │    │  • Round         │   │
│  │  • Auth          │    │  • Chat          │    │  • Kill Event    │   │
│  │  • Session       │    │  • Invitation    │    │  • Objective     │   │
│  │                  │    │  • Challenge     │    │  • Score         │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│           │                       │                       │              │
│           │              ┌────────┴────────┐              │              │
│           │              │                 │              │              │
│           ▼              ▼                 ▼              ▼              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   RANKING        │    │   LOCATION       │    │   REFEREE        │   │
│  │   CONTEXT        │    │   CONTEXT        │    │   CONTEXT        │   │
│  │                  │    │                  │    │                  │   │
│  │  • ELO           │    │  • Field         │    │  • Certification │   │
│  │  • Tier          │    │  • Review        │    │  • Assignment    │   │
│  │  • Leaderboard   │    │  • Booking       │    │  • Validation    │   │
│  │  • Achievement   │    │  • Schedule      │    │  • Conflict Res  │   │
│  │                  │    │                  │    │                  │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│                                                                          │
│                    ┌──────────────────────────┐                         │
│                    │   ADMINISTRATION         │                         │
│                    │   CONTEXT                │                         │
│                    │                          │                         │
│                    │  • Moderation            │                         │
│                    │  • Approval Workflow     │                         │
│                    │  • Reporting             │                         │
│                    │  • Audit Log             │                         │
│                    │                          │                         │
│                    └──────────────────────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Context Interactions

| Source Context | Target Context | Interaction Type | Events/Data |
|----------------|----------------|------------------|-------------|
| Identity | Community | Sync | User joined team, User left team |
| Identity | Ranking | Async | Profile stats updated |
| Community | Gameplay | Sync | Team registered for match |
| Gameplay | Ranking | Async | Match completed, ELO calculated |
| Gameplay | Referee | Sync | Kill validation request |
| Location | Gameplay | Sync | Match assigned to field |
| Referee | Gameplay | Sync | Kill confirmed/rejected |
| All | Administration | Async | Audit events, reports |

---

# 3. ENTITÀ E SCHEMI DATI

## 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIPS                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    USER      │       │    TEAM      │       │    FIELD     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ username     │──┐    │ name         │       │ name         │
│ email        │  │    │ tag          │    ┌──│ owner_id     │
│ password_hash│  │    │ leader_id    │────┘  │ address      │
│ avatar_url   │  │    │ description  │       │ coordinates  │
│ role         │  │    │ logo_url     │       │ type         │
│ tier         │  │    │ status       │       │ status       │
│ elo          │  │    │ is_recruiting│       │ max_players  │
│ referee_level│  │    │ requirements │       │ facilities   │
│ created_at   │  │    │ created_at   │       │ pricing      │
└──────┬───────┘  │    └──────┬───────┘       └──────┬───────┘
       │          │           │                      │
       │          │    ┌──────▼───────┐              │
       │          └───►│ TEAM_MEMBER  │              │
       │               ├──────────────┤              │
       │               │ team_id      │              │
       │               │ user_id      │              │
       │               │ role         │              │
       │               │ joined_at    │              │
       │               └──────────────┘              │
       │                                             │
       │          ┌──────────────┐                   │
       └─────────►│    MATCH     │◄──────────────────┘
                  ├──────────────┤
                  │ id           │
                  │ field_id     │
                  │ organizer_id │
                  │ referee_id   │
                  │ name         │
                  │ mode         │
                  │ status       │
                  │ settings     │
                  │ scheduled_at │
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ MATCH_TEAM   │ │    ROUND     │ │ KILL_EVENT   │
    ├──────────────┤ ├──────────────┤ ├──────────────┤
    │ match_id     │ │ match_id     │ │ match_id     │
    │ team_side    │ │ number       │ │ round_id     │
    │ team_id      │ │ status       │ │ killer_id    │
    │ score        │ │ started_at   │ │ victim_id    │
    │ player_ids   │ │ ended_at     │ │ position     │
    └──────────────┘ └──────────────┘ │ confidence   │
                                      │ source       │
                                      │ status       │
                                      └──────────────┘
```

## 3.2 Tabelle Database

### USERS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo univoco |
| username | VARCHAR(30) | UNIQUE, NOT NULL | Username pubblico |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email per login |
| password_hash | VARCHAR(255) | NULL | Hash password (null se OAuth) |
| avatar_url | VARCHAR(500) | NULL | URL avatar |
| role | ENUM | NOT NULL, DEFAULT 'player' | player, team_leader, referee, field_manager, admin |
| tier | ENUM | NOT NULL, DEFAULT 'bronze' | bronze, silver, gold, platinum, diamond |
| tier_level | SMALLINT | NOT NULL, DEFAULT 1 | 1-5 |
| elo | INTEGER | NOT NULL, DEFAULT 1000 | Punteggio ELO |
| referee_status | ENUM | DEFAULT 'none' | none, pending, approved, rejected |
| referee_level | SMALLINT | NULL | 1, 2, 3 |
| is_pro | BOOLEAN | DEFAULT FALSE | Abbonamento Pro |
| region | VARCHAR(50) | NULL | Regione geografica |
| bio | TEXT | NULL | Biografia profilo |
| preferences | JSONB | DEFAULT '{}' | Preferenze utente |
| last_active_at | TIMESTAMP | NULL | Ultimo accesso |
| created_at | TIMESTAMP | DEFAULT NOW() | Data creazione |
| updated_at | TIMESTAMP | DEFAULT NOW() | Ultimo aggiornamento |
| deleted_at | TIMESTAMP | NULL | Soft delete |

**Indici:**

- `idx_users_username` su `username`
- `idx_users_email` su `email`
- `idx_users_elo` su `elo DESC`
- `idx_users_region_elo` su `(region, elo DESC)`
- `idx_users_tier` su `(tier, tier_level)`

### USER_STATS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| user_id | UUID | PK, FK → users | Riferimento utente |
| matches_played | INTEGER | DEFAULT 0 | Partite giocate |
| matches_won | INTEGER | DEFAULT 0 | Partite vinte |
| total_kills | INTEGER | DEFAULT 0 | Kill totali |
| total_deaths | INTEGER | DEFAULT 0 | Morti totali |
| total_assists | INTEGER | DEFAULT 0 | Assist totali |
| total_distance_km | DECIMAL(10,2) | DEFAULT 0 | Km percorsi |
| total_time_played_min | INTEGER | DEFAULT 0 | Minuti giocati |
| headshot_kills | INTEGER | DEFAULT 0 | Kill headshot |
| objectives_completed | INTEGER | DEFAULT 0 | Obiettivi completati |
| stats_by_mode | JSONB | DEFAULT '{}' | Stats per modalità |
| stats_by_field | JSONB | DEFAULT '{}' | Stats per campo |
| updated_at | TIMESTAMP | DEFAULT NOW() | Ultimo aggiornamento |

### TEAMS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Nome team |
| tag | VARCHAR(10) | UNIQUE, NOT NULL | Tag [XX] |
| leader_id | UUID | FK → users, NOT NULL | Leader team |
| description | TEXT | NULL | Descrizione |
| logo_url | VARCHAR(500) | NULL | URL logo |
| status | ENUM | DEFAULT 'active' | active, inactive, suspended |
| is_recruiting | BOOLEAN | DEFAULT FALSE | Sta reclutando |
| max_members | SMALLINT | DEFAULT 12 | Max membri |
| requirements | JSONB | NULL | Requisiti iscrizione |
| region | VARCHAR(50) | NULL | Regione |
| rank | INTEGER | NULL | Posizione classifica |
| created_at | TIMESTAMP | DEFAULT NOW() | Data creazione |
| updated_at | TIMESTAMP | DEFAULT NOW() | Ultimo aggiornamento |

**Requirements JSONB structure:**

```
{
  "min_elo": 1000,
  "min_matches": 20,
  "min_kd": 1.5,
  "min_tier": "silver"
}
```

### TEAM_MEMBERS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| team_id | UUID | FK → teams, NOT NULL | Team |
| user_id | UUID | FK → users, NOT NULL | Utente |
| role | ENUM | DEFAULT 'member' | leader, officer, member |
| joined_at | TIMESTAMP | DEFAULT NOW() | Data ingresso |
| invited_by | UUID | FK → users | Chi ha invitato |

**Unique constraint:** `(team_id, user_id)`

### TEAM_JOIN_REQUESTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| team_id | UUID | FK → teams, NOT NULL | Team target |
| user_id | UUID | FK → users, NOT NULL | Richiedente |
| message | TEXT | NULL | Messaggio presentazione |
| status | ENUM | DEFAULT 'pending' | pending, approved, rejected |
| reviewed_by | UUID | FK → users | Chi ha revisionato |
| reviewed_at | TIMESTAMP | NULL | Data revisione |
| rejection_reason | TEXT | NULL | Motivo rifiuto |
| created_at | TIMESTAMP | DEFAULT NOW() | Data richiesta |

### FIELDS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| owner_id | UUID | FK → users, NOT NULL | Proprietario |
| name | VARCHAR(100) | NOT NULL | Nome campo |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Descrizione |
| address | JSONB | NOT NULL | Indirizzo strutturato |
| coordinates | POINT | NOT NULL | Lat/Lng (PostGIS) |
| type | ENUM | NOT NULL | outdoor, indoor, mixed |
| terrain | ENUM | NOT NULL | woodland, urban, cqb, desert, mixed |
| size_sqm | INTEGER | NOT NULL | Dimensione in mq |
| max_players | SMALLINT | NOT NULL | Capacità max |
| facilities | TEXT[] | DEFAULT '{}' | Lista servizi |
| images | TEXT[] | DEFAULT '{}' | URL immagini |
| pricing | JSONB | NOT NULL | Prezzi |
| schedule | JSONB | NOT NULL | Orari apertura |
| contact | JSONB | NOT NULL | Contatti |
| rating_avg | DECIMAL(2,1) | DEFAULT 0 | Rating medio |
| reviews_count | INTEGER | DEFAULT 0 | Numero recensioni |
| status | ENUM | DEFAULT 'pending' | pending, active, suspended, closed |
| verified_at | TIMESTAMP | NULL | Data verifica |
| verified_by | UUID | FK → users | Admin verificatore |
| created_at | TIMESTAMP | DEFAULT NOW() | Data creazione |
| updated_at | TIMESTAMP | DEFAULT NOW() | Ultimo aggiornamento |

**Indici spaziali:**

- `idx_fields_coordinates` GiST su `coordinates`
- `idx_fields_region` su `(address->>'region')`

### FIELD_REVIEWS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| field_id | UUID | FK → fields, NOT NULL | Campo |
| user_id | UUID | FK → users, NOT NULL | Autore |
| rating | SMALLINT | NOT NULL, CHECK 1-5 | Voto |
| comment | TEXT | NULL | Commento |
| images | TEXT[] | DEFAULT '{}' | Foto allegate |
| is_verified | BOOLEAN | DEFAULT FALSE | Utente ha giocato qui |
| helpful_count | INTEGER | DEFAULT 0 | Voti utili |
| created_at | TIMESTAMP | DEFAULT NOW() | Data |
| updated_at | TIMESTAMP | DEFAULT NOW() | Ultimo aggiornamento |

**Unique constraint:** `(field_id, user_id)` - una recensione per utente

### MATCHES

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| field_id | UUID | FK → fields, NOT NULL | Campo |
| organizer_id | UUID | FK → users, NOT NULL | Organizzatore |
| referee_id | UUID | FK → users | Arbitro assegnato |
| name | VARCHAR(100) | NOT NULL | Nome partita |
| mode | ENUM | NOT NULL | ctf, tdm, elimination, vip, domination |
| status | ENUM | DEFAULT 'scheduled' | scheduled, lobby, active, paused, ended, cancelled |
| settings | JSONB | NOT NULL | Configurazione |
| current_round | SMALLINT | DEFAULT 0 | Round corrente |
| scheduled_at | TIMESTAMP | NOT NULL | Data programmata |
| started_at | TIMESTAMP | NULL | Inizio effettivo |
| ended_at | TIMESTAMP | NULL | Fine |
| created_at | TIMESTAMP | DEFAULT NOW() | Creazione |
| updated_at | TIMESTAMP | DEFAULT NOW() | Aggiornamento |

**Settings JSONB structure:**

```
{
  "max_players_per_team": 8,
  "rounds": 3,
  "round_duration_min": 20,
  "respawn_enabled": true,
  "respawn_time_sec": 30,
  "friendly_fire": false,
  "objectives": {...}
}
```

### MATCH_PARTICIPANTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| match_id | UUID | FK → matches, NOT NULL | Partita |
| user_id | UUID | FK → users, NOT NULL | Giocatore |
| team_side | ENUM | NOT NULL | alpha, bravo |
| team_id | UUID | FK → teams | Team (se applicabile) |
| status | ENUM | DEFAULT 'registered' | registered, checked_in, playing, spectating, left |
| stats | JSONB | DEFAULT '{}' | Stats partita |
| joined_at | TIMESTAMP | DEFAULT NOW() | Iscrizione |
| checked_in_at | TIMESTAMP | NULL | Check-in |

### KILL_EVENTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| match_id | UUID | FK → matches, NOT NULL | Partita |
| round_number | SMALLINT | NOT NULL | Numero round |
| killer_id | UUID | FK → users, NOT NULL | Killer |
| victim_id | UUID | FK → users, NOT NULL | Vittima |
| position | POINT | NULL | Posizione GPS |
| distance_m | DECIMAL(6,2) | NULL | Distanza |
| weapon | VARCHAR(50) | NULL | Arma usata |
| is_headshot | BOOLEAN | DEFAULT FALSE | Headshot |
| confidence | DECIMAL(3,2) | NOT NULL | Score confidenza 0-1 |
| source | ENUM | NOT NULL | auto, manual, referee |
| status | ENUM | DEFAULT 'pending' | pending, confirmed, disputed, rejected |
| confirmed_by | UUID | FK → users | Chi ha confermato |
| confirmed_at | TIMESTAMP | NULL | Data conferma |
| created_at | TIMESTAMP | DEFAULT NOW() | Timestamp evento |

### CONVERSATIONS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| type | ENUM | NOT NULL | private, team, match, group |
| name | VARCHAR(100) | NULL | Nome (per gruppi) |
| avatar_url | VARCHAR(500) | NULL | Immagine gruppo |
| team_id | UUID | FK → teams | Se chat team |
| match_id | UUID | FK → matches | Se chat partita |
| created_by | UUID | FK → users | Creatore |
| last_message_at | TIMESTAMP | NULL | Ultimo messaggio |
| created_at | TIMESTAMP | DEFAULT NOW() | Creazione |

### CONVERSATION_PARTICIPANTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| conversation_id | UUID | FK, PK | Conversazione |
| user_id | UUID | FK, PK | Partecipante |
| role | ENUM | DEFAULT 'member' | owner, admin, member |
| last_read_at | TIMESTAMP | NULL | Ultimo messaggio letto |
| is_muted | BOOLEAN | DEFAULT FALSE | Notifiche silenziate |
| joined_at | TIMESTAMP | DEFAULT NOW() | Ingresso |

### MESSAGES

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| conversation_id | UUID | FK → conversations, NOT NULL | Conversazione |
| sender_id | UUID | FK → users, NOT NULL | Mittente |
| content | TEXT | NOT NULL | Contenuto |
| type | ENUM | DEFAULT 'text' | text, image, system, achievement |
| reply_to_id | UUID | FK → messages | Risposta a |
| metadata | JSONB | DEFAULT '{}' | Dati extra |
| is_edited | BOOLEAN | DEFAULT FALSE | Modificato |
| created_at | TIMESTAMP | DEFAULT NOW() | Invio |
| edited_at | TIMESTAMP | NULL | Ultima modifica |
| deleted_at | TIMESTAMP | NULL | Soft delete |

### MESSAGE_REACTIONS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| message_id | UUID | FK, PK | Messaggio |
| user_id | UUID | FK, PK | Utente |
| emoji | VARCHAR(10) | PK | Emoji reazione |
| created_at | TIMESTAMP | DEFAULT NOW() | Data |

### INBOX_ITEMS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| user_id | UUID | FK → users, NOT NULL | Destinatario |
| type | ENUM | NOT NULL | Tipo notifica |
| title | VARCHAR(200) | NOT NULL | Titolo |
| content | TEXT | NOT NULL | Contenuto |
| metadata | JSONB | DEFAULT '{}' | Dati strutturati |
| is_read | BOOLEAN | DEFAULT FALSE | Letto |
| is_archived | BOOLEAN | DEFAULT FALSE | Archiviato |
| actions | JSONB | DEFAULT '[]' | Azioni disponibili |
| created_at | TIMESTAMP | DEFAULT NOW() | Data |
| read_at | TIMESTAMP | NULL | Data lettura |

### REFEREE_REQUESTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| user_id | UUID | FK → users, NOT NULL | Candidato |
| level | SMALLINT | NOT NULL | 1, 2, 3 |
| experience | JSONB | NOT NULL | Esperienza dichiarata |
| motivation | TEXT | NOT NULL | Motivazione |
| availability | TEXT[] | NOT NULL | Giorni disponibili |
| documents | TEXT[] | DEFAULT '{}' | Documenti allegati |
| status | ENUM | DEFAULT 'pending' | pending, under_review, exam_scheduled, approved, rejected |
| exam_date | TIMESTAMP | NULL | Data esame |
| exam_result | ENUM | NULL | passed, failed |
| notes | TEXT | NULL | Note admin |
| reviewed_by | UUID | FK → users | Revisore |
| reviewed_at | TIMESTAMP | NULL | Data revisione |
| created_at | TIMESTAMP | DEFAULT NOW() | Richiesta |

### FIELD_REGISTRATION_REQUESTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| submitted_by | UUID | FK → users, NOT NULL | Richiedente |
| field_data | JSONB | NOT NULL | Dati campo |
| documents | TEXT[] | DEFAULT '{}' | Documenti |
| status | ENUM | DEFAULT 'pending' | pending, under_review, approved, rejected |
| notes | TEXT | NULL | Note |
| reviewed_by | UUID | FK → users | Revisore |
| reviewed_at | TIMESTAMP | NULL | Data |
| created_at | TIMESTAMP | DEFAULT NOW() | Richiesta |

### ACHIEVEMENTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | VARCHAR(50) | PK | Codice achievement |
| name | VARCHAR(100) | NOT NULL | Nome |
| description | TEXT | NOT NULL | Descrizione |
| icon | VARCHAR(50) | NOT NULL | Icona/Emoji |
| category | ENUM | NOT NULL | combat, social, milestone, special |
| xp_reward | INTEGER | DEFAULT 0 | XP guadagnati |
| is_hidden | BOOLEAN | DEFAULT FALSE | Nascosto fino a unlock |
| criteria | JSONB | NOT NULL | Criteri sblocco |

### USER_ACHIEVEMENTS

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| user_id | UUID | FK → users, PK | Utente |
| achievement_id | VARCHAR(50) | FK → achievements, PK | Achievement |
| unlocked_at | TIMESTAMP | DEFAULT NOW() | Data sblocco |
| progress | JSONB | DEFAULT '{}' | Progresso (se incrementale) |

### AUDIT_LOG

| Campo | Tipo | Constraints | Descrizione |
|-------|------|-------------|-------------|
| id | UUID | PK | Identificativo |
| actor_id | UUID | FK → users | Chi ha eseguito |
| action | VARCHAR(100) | NOT NULL | Azione eseguita |
| target_type | VARCHAR(50) | NOT NULL | Tipo entità |
| target_id | UUID | NOT NULL | ID entità |
| old_values | JSONB | NULL | Valori precedenti |
| new_values | JSONB | NULL | Nuovi valori |
| ip_address | INET | NULL | IP address |
| user_agent | TEXT | NULL | User agent |
| created_at | TIMESTAMP | DEFAULT NOW() | Timestamp |

**Indici:**

- `idx_audit_actor` su `actor_id`
- `idx_audit_target` su `(target_type, target_id)`
- `idx_audit_created` su `created_at DESC`

---

# 4. API SPECIFICATION

## 4.1 API Overview

| Modulo | Base Path | Descrizione |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Autenticazione e sessioni |
| Users | `/api/v1/users` | Gestione utenti |
| Teams | `/api/v1/teams` | Team e membri |
| Fields | `/api/v1/fields` | Campi e recensioni |
| Matches | `/api/v1/matches` | Partite e gameplay |
| Rankings | `/api/v1/rankings` | Classifiche |
| Chat | `/api/v1/chat` | Messaggistica |
| Notifications | `/api/v1/notifications` | Inbox e notifiche |
| Referees | `/api/v1/referees` | Gestione arbitri |
| Admin | `/api/v1/admin` | Amministrazione |

## 4.2 Endpoints per Modulo

### AUTH ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrazione email | No |
| POST | `/auth/login` | Login email/password | No |
| POST | `/auth/oauth/{provider}` | OAuth (google, apple) | No |
| POST | `/auth/refresh` | Refresh token | Token |
| POST | `/auth/logout` | Logout | Token |
| POST | `/auth/password/forgot` | Richiesta reset | No |
| POST | `/auth/password/reset` | Reset password | Token |
| GET | `/auth/me` | Current user | Token |

### USERS ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/users` | Lista utenti (search) | Token |
| GET | `/users/:id` | Dettaglio utente | Token |
| GET | `/users/:id/stats` | Statistiche utente | Token |
| GET | `/users/:id/matches` | Storico partite | Token |
| GET | `/users/:id/achievements` | Achievements | Token |
| PATCH | `/users/me` | Aggiorna profilo | Token |
| PATCH | `/users/me/avatar` | Upload avatar | Token |
| GET | `/users/me/inbox` | Inbox notifiche | Token |
| PATCH | `/users/me/inbox/:id` | Segna letto | Token |
| DELETE | `/users/me/inbox/:id` | Archivia | Token |

### TEAMS ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/teams` | Lista team | Token |
| POST | `/teams` | Crea team | Token |
| GET | `/teams/:id` | Dettaglio team | Token |
| PATCH | `/teams/:id` | Modifica team | Leader |
| DELETE | `/teams/:id` | Elimina team | Leader |
| GET | `/teams/:id/members` | Lista membri | Token |
| POST | `/teams/:id/members` | Invita membro | Officer+ |
| DELETE | `/teams/:id/members/:userId` | Rimuovi membro | Officer+ |
| PATCH | `/teams/:id/members/:userId` | Cambia ruolo | Leader |
| GET | `/teams/:id/requests` | Richieste pending | Officer+ |
| POST | `/teams/:id/requests` | Richiedi iscrizione | Token |
| PATCH | `/teams/:id/requests/:reqId` | Approva/Rifiuta | Officer+ |
| POST | `/teams/:id/challenges` | Sfida altro team | Leader |
| GET | `/teams/:id/challenges` | Sfide ricevute | Officer+ |
| PATCH | `/teams/:id/challenges/:id` | Rispondi sfida | Leader |
| GET | `/teams/:id/stats` | Stats team | Token |

### FIELDS ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/fields` | Lista campi | Public |
| GET | `/fields/nearby` | Campi vicini (geo) | Public |
| GET | `/fields/:id` | Dettaglio campo | Public |
| POST | `/fields` | Registra campo | Token |
| PATCH | `/fields/:id` | Modifica campo | Owner |
| GET | `/fields/:id/reviews` | Recensioni | Public |
| POST | `/fields/:id/reviews` | Aggiungi recensione | Token |
| PATCH | `/fields/:id/reviews/:revId` | Modifica recensione | Author |
| DELETE | `/fields/:id/reviews/:revId` | Elimina recensione | Author |
| GET | `/fields/:id/schedule` | Disponibilità | Public |
| GET | `/fields/:id/matches` | Partite programmate | Public |

### MATCHES ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/matches` | Lista partite | Token |
| GET | `/matches/live` | Partite in corso | Token |
| GET | `/matches/upcoming` | Prossime partite | Token |
| POST | `/matches` | Crea partita | Token |
| GET | `/matches/:id` | Dettaglio partita | Token |
| PATCH | `/matches/:id` | Modifica partita | Organizer |
| DELETE | `/matches/:id` | Annulla partita | Organizer |
| POST | `/matches/:id/join` | Iscriviti | Token |
| DELETE | `/matches/:id/leave` | Lascia partita | Token |
| POST | `/matches/:id/checkin` | Check-in | Participant |
| POST | `/matches/:id/start` | Avvia partita | Organizer |
| POST | `/matches/:id/pause` | Pausa | Org/Ref |
| POST | `/matches/:id/resume` | Riprendi | Org/Ref |
| POST | `/matches/:id/end` | Termina | Org/Ref |
| POST | `/matches/:id/rounds/:n/start` | Avvia round | Org/Ref |
| POST | `/matches/:id/rounds/:n/end` | Termina round | Org/Ref |
| GET | `/matches/:id/events` | Eventi partita | Participant |
| POST | `/matches/:id/kills` | Segnala kill | Participant |
| PATCH | `/matches/:id/kills/:killId` | Conferma/Contesta | Victim/Ref |
| GET | `/matches/:id/scoreboard` | Scoreboard live | Participant |
| GET | `/matches/:id/positions` | Posizioni GPS | Participant |
| GET | `/matches/:id/summary` | Riepilogo finale | Participant |

### RANKINGS ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/rankings/players` | Classifica globale | Public |
| GET | `/rankings/players/regional` | Classifica regionale | Public |
| GET | `/rankings/players/friends` | Classifica amici | Token |
| GET | `/rankings/teams` | Classifica team | Public |
| GET | `/rankings/me` | Mia posizione | Token |
| GET | `/rankings/history` | Storico ELO | Token |

### CHAT ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/chat/conversations` | Lista conversazioni | Token |
| POST | `/chat/conversations` | Nuova conversazione | Token |
| GET | `/chat/conversations/:id` | Dettaglio conv | Participant |
| DELETE | `/chat/conversations/:id` | Lascia conv | Participant |
| GET | `/chat/conversations/:id/messages` | Messaggi | Participant |
| POST | `/chat/conversations/:id/messages` | Invia messaggio | Participant |
| PATCH | `/chat/messages/:id` | Modifica msg | Author |
| DELETE | `/chat/messages/:id` | Elimina msg | Author |
| POST | `/chat/messages/:id/reactions` | Aggiungi reaction | Participant |
| DELETE | `/chat/messages/:id/reactions/:emoji` | Rimuovi reaction | Author |
| POST | `/chat/conversations/:id/read` | Segna letti | Participant |

### REFEREES ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/referees` | Lista arbitri | Public |
| GET | `/referees/:id` | Dettaglio arbitro | Public |
| POST | `/referees/apply` | Richiedi patentino | Token |
| GET | `/referees/my-application` | Mia richiesta | Token |
| GET | `/referees/matches` | Partite da arbitrare | Referee |
| POST | `/referees/matches/:id/accept` | Accetta partita | Referee |
| POST | `/referees/matches/:id/decline` | Rifiuta partita | Referee |

### ADMIN ENDPOINTS

| Method | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/admin/dashboard` | Stats dashboard | Admin |
| GET | `/admin/users` | Lista utenti | Admin |
| PATCH | `/admin/users/:id` | Modifica utente | Admin |
| POST | `/admin/users/:id/ban` | Ban utente | Admin |
| POST | `/admin/users/:id/unban` | Unban utente | Admin |
| GET | `/admin/teams` | Lista team | Admin |
| PATCH | `/admin/teams/:id` | Modifica team | Admin |
| POST | `/admin/teams/:id/suspend` | Sospendi team | Admin |
| GET | `/admin/fields` | Lista campi | Admin |
| GET | `/admin/fields/pending` | Campi da approvare | Admin |
| PATCH | `/admin/fields/:id` | Modifica campo | Admin |
| POST | `/admin/fields/:id/approve` | Approva campo | Admin |
| POST | `/admin/fields/:id/reject` | Rifiuta campo | Admin |
| POST | `/admin/fields/:id/suspend` | Sospendi campo | Admin |
| GET | `/admin/referees/requests` | Richieste arbitro | Admin |
| PATCH | `/admin/referees/requests/:id` | Gestisci richiesta | Admin |
| POST | `/admin/referees/:id/promote` | Promuovi livello | Admin |
| POST | `/admin/referees/:id/demote` | Declassa | Admin |
| GET | `/admin/reports` | Segnalazioni | Admin |
| PATCH | `/admin/reports/:id` | Gestisci segnalazione | Admin |
| GET | `/admin/audit` | Audit log | Admin |

## 4.3 Response Format Standard

```
SUCCESS RESPONSE:
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}

ERROR RESPONSE:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## 4.4 Error Codes

| Code | HTTP Status | Descrizione |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Errore validazione input |
| UNAUTHORIZED | 401 | Non autenticato |
| FORBIDDEN | 403 | Non autorizzato |
| NOT_FOUND | 404 | Risorsa non trovata |
| CONFLICT | 409 | Conflitto (es. username già usato) |
| RATE_LIMITED | 429 | Troppe richieste |
| INTERNAL_ERROR | 500 | Errore server |

---

# 5. AUTENTICAZIONE E AUTORIZZAZIONE

## 5.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

EMAIL/PASSWORD LOGIN:

  Client                    Backend                     Database
    │                          │                            │
    │  POST /auth/login        │                            │
    │  {email, password}       │                            │
    │─────────────────────────►│                            │
    │                          │  Find user by email        │
    │                          │───────────────────────────►│
    │                          │◄───────────────────────────│
    │                          │                            │
    │                          │  Verify password hash      │
    │                          │  Generate tokens           │
    │                          │                            │
    │                          │  Store refresh token       │
    │                          │───────────────────────────►│
    │  {accessToken,           │◄───────────────────────────│
    │   refreshToken,          │                            │
    │   user}                  │                            │
    │◄─────────────────────────│                            │


OAUTH FLOW:

  Client                    Backend                   OAuth Provider
    │                          │                            │
    │  GET /auth/oauth/google  │                            │
    │─────────────────────────►│                            │
    │                          │                            │
    │  Redirect to Google      │                            │
    │◄─────────────────────────│                            │
    │                          │                            │
    │─────────────────────────────────────────────────────►│
    │                          │                            │
    │◄─────────────────────────────────────────────────────│
    │  Callback with code      │                            │
    │                          │                            │
    │  GET /auth/oauth/callback│                            │
    │  ?code=xxx               │                            │
    │─────────────────────────►│                            │
    │                          │  Exchange code for token   │
    │                          │───────────────────────────►│
    │                          │◄───────────────────────────│
    │                          │                            │
    │                          │  Get user profile          │
    │                          │───────────────────────────►│
    │                          │◄───────────────────────────│
    │                          │                            │
    │                          │  Find/Create user          │
    │                          │  Generate tokens           │
    │                          │                            │
    │  Redirect to app         │                            │
    │  with tokens             │                            │
    │◄─────────────────────────│                            │


TOKEN REFRESH:

  Client                    Backend                     Redis
    │                          │                            │
    │  POST /auth/refresh      │                            │
    │  {refreshToken}          │                            │
    │─────────────────────────►│                            │
    │                          │  Validate refresh token    │
    │                          │───────────────────────────►│
    │                          │◄───────────────────────────│
    │                          │                            │
    │                          │  Invalidate old token      │
    │                          │  Generate new tokens       │
    │                          │  Store new refresh token   │
    │                          │───────────────────────────►│
    │  {accessToken,           │◄───────────────────────────│
    │   refreshToken}          │                            │
    │◄─────────────────────────│                            │
```

## 5.2 Token Structure

```
ACCESS TOKEN (JWT):
{
  "sub": "user_uuid",
  "email": "user@email.com",
  "role": "player",
  "tier": "gold",
  "permissions": ["read:matches", "write:matches", ...],
  "iat": 1703180400,
  "exp": 1703184000  // 1 hour
}

REFRESH TOKEN:
- Opaque token stored in Redis
- TTL: 30 days
- One-time use (rotated on refresh)
```

## 5.3 Authorization Matrix

| Role | Users | Teams | Fields | Matches | Admin |
|------|-------|-------|--------|---------|-------|
| guest | R(limited) | R(limited) | R | R | - |
| player | R/W(self) | R/W(own) | R | R/W | - |
| team_leader | R/W(self) | R/W/D(own) | R | R/W | - |
| referee | R/W(self) | R | R | R/W(assigned) | - |
| field_manager | R/W(self) | R | R/W/D(own) | R/W(own field) | - |
| admin | R/W/D | R/W/D | R/W/D | R/W/D | Full |

**Legenda:** R=Read, W=Write, D=Delete

## 5.4 Permission Guards

```
PERMISSION DEFINITIONS:

// User permissions
users:read           - Visualizzare profili utenti
users:write:self     - Modificare proprio profilo
users:write:any      - Modificare qualsiasi profilo (admin)
users:delete         - Eliminare utenti (admin)

// Team permissions  
teams:read           - Visualizzare team
teams:create         - Creare team
teams:write:own      - Modificare proprio team
teams:write:any      - Modificare qualsiasi team (admin)
teams:members:manage - Gestire membri team
teams:delete:own     - Eliminare proprio team
teams:delete:any     - Eliminare qualsiasi team (admin)

// Field permissions
fields:read          - Visualizzare campi
fields:create        - Registrare campo
fields:write:own     - Modificare proprio campo
fields:write:any     - Modificare qualsiasi campo (admin)
fields:approve       - Approvare campi (admin)
fields:delete        - Eliminare campi (admin)

// Match permissions
matches:read         - Visualizzare partite
matches:create       - Creare partite
matches:write:own    - Modificare proprie partite
matches:write:any    - Modificare qualsiasi partita
matches:referee      - Arbitrare partite
matches:join         - Partecipare a partite

// Admin permissions
admin:dashboard      - Accesso dashboard admin
admin:users          - Gestione utenti
admin:moderation     - Gestione segnalazioni
admin:audit          - Visualizzare audit log
```

---

# 6. REAL-TIME E WEBSOCKET

## 6.1 WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WEBSOCKET ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │    SOCKET.IO SERVER      │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │    NAMESPACES      │  │
                    │  │                    │  │
                    │  │  /chat             │  │
                    │  │  /match            │  │
                    │  │  /notifications    │  │
                    │  │  /presence         │  │
                    │  │                    │  │
                    │  └────────────────────┘  │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │      ROOMS         │  │
                    │  │                    │  │
                    │  │  conversation:{id} │  │
                    │  │  match:{id}        │  │
                    │  │  team:{id}         │  │
                    │  │  user:{id}         │  │
                    │  │                    │  │
                    │  └────────────────────┘  │
                    │                          │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │         REDIS            │
                    │     (Pub/Sub Adapter)    │
                    │                          │
                    │  - Cross-instance msgs   │
                    │  - Presence tracking     │
                    │  - Room state            │
                    │                          │
                    └──────────────────────────┘
```

## 6.2 WebSocket Events

### Namespace: /chat

| Event | Direction | Payload | Descrizione |
|-------|-----------|---------|-------------|
| `join_conversation` | C→S | `{conversationId}` | Entra in room |
| `leave_conversation` | C→S | `{conversationId}` | Esci da room |
| `send_message` | C→S | `{conversationId, content, type, replyTo?}` | Invia messaggio |
| `new_message` | S→C | `{message}` | Nuovo messaggio ricevuto |
| `typing_start` | C→S | `{conversationId}` | Inizia digitazione |
| `typing_stop` | C→S | `{conversationId}` | Fine digitazione |
| `user_typing` | S→C | `{conversationId, userId, username}` | Utente sta scrivendo |
| `message_read` | C→S | `{conversationId, messageIds}` | Segna letti |
| `messages_read` | S→C | `{conversationId, userId, messageIds}` | Messaggi letti |
| `add_reaction` | C→S | `{messageId, emoji}` | Aggiungi reaction |
| `remove_reaction` | C→S | `{messageId, emoji}` | Rimuovi reaction |
| `reaction_updated` | S→C | `{messageId, reactions}` | Reaction aggiornata |
| `message_edited` | S→C | `{message}` | Messaggio modificato |
| `message_deleted` | S→C | `{messageId, conversationId}` | Messaggio eliminato |

### Namespace: /match

| Event | Direction | Payload | Descrizione |
|-------|-----------|---------|-------------|
| `join_match` | C→S | `{matchId, role}` | Entra in partita |
| `leave_match` | C→S | `{matchId}` | Esci da partita |
| `match_status` | S→C | `{matchId, status, ...}` | Cambio stato |
| `round_start` | S→C | `{matchId, round, ...}` | Inizio round |
| `round_end` | S→C | `{matchId, round, scores}` | Fine round |
| `position_update` | C→S | `{lat, lng, accuracy}` | Aggiorna posizione |
| `positions` | S→C | `{matchId, positions[]}` | Posizioni giocatori |
| `kill_claim` | C→S | `{victimId, position}` | Reclama kill |
| `kill_event` | S→C | `{killId, killerId, victimId, ...}` | Evento kill |
| `kill_confirm` | C→S | `{killId, confirmed}` | Conferma/Nega kill |
| `kill_updated` | S→C | `{killId, status, ...}` | Kill aggiornata |
| `score_update` | S→C | `{matchId, scores}` | Aggiornamento score |
| `player_status` | S→C | `{userId, status}` | Stato giocatore (alive/dead) |
| `objective_update` | S→C | `{objective, status}` | Stato obiettivo |
| `match_end` | S→C | `{matchId, result, summary}` | Fine partita |

### Namespace: /notifications

| Event | Direction | Payload | Descrizione |
|-------|-----------|---------|-------------|
| `subscribe` | C→S | - | Sottoscrivi notifiche |
| `notification` | S→C | `{type, title, content, ...}` | Nuova notifica |
| `inbox_count` | S→C | `{unreadCount}` | Counter aggiornato |
| `mark_read` | C→S | `{notificationId}` | Segna letta |

### Namespace: /presence

| Event | Direction | Payload | Descrizione |
|-------|-----------|---------|-------------|
| `online` | C→S | - | Utente online |
| `offline` | C→S | - | Utente offline |
| `user_online` | S→C | `{userId}` | Utente diventato online |
| `user_offline` | S→C | `{userId}` | Utente diventato offline |
| `subscribe_users` | C→S | `{userIds[]}` | Monitora presenza utenti |
| `presence_list` | S→C | `{online: userId[]}` | Lista utenti online |

## 6.3 Room Naming Convention

```
ROOM PATTERNS:

conversation:{conversationId}     → Chat room
match:{matchId}                   → Partita (tutti)
match:{matchId}:alpha             → Team Alpha
match:{matchId}:bravo             → Team Bravo
match:{matchId}:referee           → Solo arbitro
match:{matchId}:spectators        → Spettatori
team:{teamId}                     → Team notifications
user:{userId}                     → Personal notifications
admin                             → Admin broadcast
```

---

# 7. BUSINESS RULES

## 7.1 User Rules

| Rule ID | Descrizione | Validazione |
|---------|-------------|-------------|
| USR-001 | Username unico, 3-30 caratteri alfanumerici | Regex + DB unique |
| USR-002 | Email valida e unica | Regex + DB unique |
| USR-003 | Password min 8 char, 1 upper, 1 lower, 1 number | Regex |
| USR-004 | Un utente può essere membro di un solo team | Check before join |
| USR-005 | Upgrade tier automatico al raggiungimento ELO | Trigger on ELO update |
| USR-006 | Downgrade tier solo a fine stagione | Scheduled job |
| USR-007 | Requisiti minimi per richiesta arbitro: 50+ match, Silver+ | Pre-check |

## 7.2 Team Rules

| Rule ID | Descrizione | Validazione |
|---------|-------------|-------------|
| TEM-001 | Nome team unico, 3-50 caratteri | Regex + DB unique |
| TEM-002 | Tag team unico, formato [XX] 2-5 char | Regex + DB unique |
| TEM-003 | Max membri configurabile (default 12) | Check on join |
| TEM-004 | Solo leader può sciogliere team | Permission check |
| TEM-005 | Leader non può lasciare team senza passaggio consegne | Business logic |
| TEM-006 | Requisiti iscrizione opzionali (minElo, minMatches, minKd) | Validate on request |
| TEM-007 | Richieste pending scadono dopo 7 giorni | Scheduled cleanup |

## 7.3 Match Rules

| Rule ID | Descrizione | Validazione |
|---------|-------------|-------------|
| MAT-001 | Partita richiede almeno 2 giocatori per team | Validate on start |
| MAT-002 | Solo organizzatore o arbitro possono avviare | Permission check |
| MAT-003 | Partita ranked richiede min 4v4 | Mode check |
| MAT-004 | Kill auto-confermata se confidence > 0.95 | Business logic |
| MAT-005 | Kill contestata richiede review arbitro | Workflow |
| MAT-006 | Timeout conferma vittima: 60 secondi | Timer |
| MAT-007 | ELO calcolato solo per partite ranked concluse | Post-match job |
| MAT-008 | Annullamento partita possibile solo se non iniziata | Status check |

## 7.4 Field Rules

| Rule ID | Descrizione | Validazione |
|---------|-------------|-------------|
| FLD-001 | Approvazione richiede documenti validi | Admin review |
| FLD-002 | Rating calcolato come media ponderata | Algorithm |
| FLD-003 | Una sola recensione per utente per campo | DB unique |
| FLD-004 | Recensione verificata se utente ha giocato in quel campo | Match history check |
| FLD-005 | Campo sospeso se rating < 2.0 per 30+ recensioni | Automated |
| FLD-006 | Coordinate devono essere in Italia | Geo validation |

## 7.5 Ranking Rules

| Rule ID | Descrizione | Validazione |
|---------|-------------|-------------|
| RNK-001 | ELO iniziale: 1000 | Default value |
| RNK-002 | ELO K-factor: 32 (nuovi), 24 (normali), 16 (esperti) | Algorithm |
| RNK-003 | Tier basato su ELO (vedi tabella sotto) | Computed |
| RNK-004 | Decay ELO dopo 30 giorni inattività: -10 ELO/settimana | Scheduled job |
| RNK-005 | ELO minimo: 100 | Floor check |
| RNK-006 | ELO massimo: 3500 | Ceiling check |
| RNK-007 | Reset stagionale: soft reset verso 1000 | Formula: (ELO + 1000) / 2 |

**Tier Thresholds:**

| Tier | ELO Range | % Popolazione |
|------|-----------|---------------|
| Bronze I-V | 100-999 | ~40% |
| Silver I-V | 1000-1499 | ~30% |
| Gold I-V | 1500-1999 | ~20% |
| Platinum I-V | 2000-2499 | ~8% |
| Diamond I-V | 2500+ | ~2% |

## 7.6 ELO Calculation

```
FORMULA ELO:

Expected Score:
  E_a = 1 / (1 + 10^((R_b - R_a) / 400))

New Rating:
  R'_a = R_a + K * (S_a - E_a)

Where:
  R_a = Rating giocatore A
  R_b = Rating avversario medio
  K = K-factor (32/24/16)
  S_a = Score reale (1 = vittoria, 0.5 = pareggio, 0 = sconfitta)
  E_a = Score atteso

MODIFIERS:
  - Team match: ELO avversario = media ELO team avversario
  - Performance bonus: +10% se K/D > 3.0
  - MVP bonus: +5 ELO fissi
  - Stomp penalty: -20% se squadra troppo forte (diff ELO > 300)
```

---

# 8. BDD FEATURES

## 8.1 Auth Features

```gherkin
Feature: User Registration
  Come nuovo utente
  Voglio registrarmi alla piattaforma
  Per poter partecipare alle partite di softair

  Background:
    Given il sistema è operativo
    And non sono autenticato

  Scenario: Registrazione con email valida
    When inserisco email "nuovo@example.com"
    And inserisco password "Password123!"
    And inserisco username "NuovoPlayer"
    And confermo la registrazione
    Then l'account viene creato
    And ricevo email di conferma
    And vengo autenticato automaticamente
    And il mio tier è "Bronze I"
    And il mio ELO è 1000

  Scenario: Registrazione con email già esistente
    Given esiste un utente con email "esistente@example.com"
    When provo a registrarmi con email "esistente@example.com"
    Then ricevo errore "Email già registrata"
    And l'account non viene creato

  Scenario: Registrazione con username già esistente
    Given esiste un utente con username "PlayerEsistente"
    When provo a registrarmi con username "PlayerEsistente"
    Then ricevo errore "Username non disponibile"

  Scenario: Password non conforme
    When inserisco password "weak"
    Then ricevo errore "Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero"


Feature: User Authentication
  Come utente registrato
  Voglio effettuare il login
  Per accedere alle funzionalità della piattaforma

  Scenario: Login con credenziali corrette
    Given sono un utente registrato con email "user@example.com"
    When effettuo login con email e password corretti
    Then vengo autenticato
    And ricevo access token valido
    And ricevo refresh token valido
    And vengo reindirizzato alla dashboard

  Scenario: Login con password errata
    Given sono un utente registrato
    When effettuo login con password errata
    Then ricevo errore "Credenziali non valide"
    And il tentativo viene loggato
    And dopo 5 tentativi l'account viene bloccato per 15 minuti

  Scenario: Login OAuth con Google
    When clicco "Continua con Google"
    And autorizzo l'accesso
    Then vengo autenticato
    And se l'account non esiste viene creato automaticamente

  Scenario: Refresh token
    Given ho un refresh token valido
    When il mio access token scade
    And richiedo un nuovo token
    Then ricevo nuovo access token
    And il vecchio refresh token viene invalidato
    And ricevo nuovo refresh token
```

## 8.2 Team Features

```gherkin
Feature: Team Creation
  Come giocatore senza team
  Voglio creare un nuovo team
  Per organizzare partite con i miei amici

  Background:
    Given sono autenticato come "player"
    And non appartengo a nessun team

  Scenario: Creazione team valido
    When creo team con nome "Shadow Wolves"
    And tag "[SW]"
    And descrizione "Strike Fast. Strike Silent."
    Then il team viene creato
    And divento leader del team
    And il mio ruolo diventa "team_leader"
    And il team appare nelle classifiche

  Scenario: Creazione team con nome duplicato
    Given esiste team con nome "Alpha Squad"
    When creo team con nome "Alpha Squad"
    Then ricevo errore "Nome team già esistente"

  Scenario: Creazione team già appartenendo a uno
    Given appartengo al team "Beta Force"
    When provo a creare un nuovo team
    Then ricevo errore "Devi prima lasciare il tuo team attuale"


Feature: Team Membership
  Come giocatore
  Voglio unirmi a un team
  Per partecipare alle attività di squadra

  Scenario: Richiesta iscrizione a team aperto
    Given esiste team "Shadow Wolves" con recruiting attivo
    And soddisfo i requisiti minimi del team
    When invio richiesta di iscrizione
    And includo messaggio di presentazione
    Then la richiesta viene inviata
    And il leader riceve notifica
    And lo stato richiesta è "pending"

  Scenario: Requisiti non soddisfatti
    Given team "Elite Force" richiede minimo 1500 ELO
    And il mio ELO è 1200
    When provo a richiedere iscrizione
    Then ricevo errore "Non soddisfi i requisiti: ELO minimo 1500"

  Scenario: Approvazione richiesta
    Given sono leader di "Shadow Wolves"
    And ho richiesta pending da "NuovoPlayer"
    When approvo la richiesta
    Then "NuovoPlayer" diventa membro del team
    And riceve notifica di accettazione
    And appare nella lista membri

  Scenario: Rifiuto richiesta
    Given sono leader di "Shadow Wolves"
    And ho richiesta pending da "SpamPlayer"
    When rifiuto la richiesta con motivazione "Profilo sospetto"
    Then la richiesta viene chiusa
    And "SpamPlayer" riceve notifica con motivazione
    And non può richiedere nuovamente per 7 giorni
```

## 8.3 Match Features

```gherkin
Feature: Match Creation
  Come utente autenticato
  Voglio creare una partita
  Per organizzare un evento di gioco

  Background:
    Given sono autenticato
    And esiste campo "Campo Alpha" attivo

  Scenario: Creazione partita standard
    When creo partita con:
      | campo          | Campo Alpha        |
      | nome           | Domenica CTF       |
      | modalità       | CTF                |
      | data           | prossimo sabato    |
      | max_per_team   | 8                  |
      | rounds         | 3                  |
    Then la partita viene creata
    And lo stato è "scheduled"
    And sono l'organizzatore
    And la partita appare nel calendario

  Scenario: Partita con team preregistrato
    Given sono leader di "Shadow Wolves"
    When creo partita team vs team
    And invito "Alpha Squad"
    Then "Alpha Squad" riceve sfida
    And la partita è in stato "pending_acceptance"


Feature: Match Gameplay
  Come partecipante a una partita
  Voglio interagire durante il gioco
  Per registrare le mie azioni

  Background:
    Given la partita "CTF Domenica" è in stato "active"
    And sono partecipante nel team Alpha
    And il mio stato è "alive"

  Scenario: Segnalazione kill valida
    Given sono a 15 metri dal giocatore "EnemyPlayer"
    When segnalo di aver eliminato "EnemyPlayer"
    Then viene creato evento kill
    And confidence calcolata è 0.85
    And "EnemyPlayer" riceve notifica di conferma
    And ho 60 secondi per la conferma

  Scenario: Conferma kill da vittima
    Given ho segnalato kill su "EnemyPlayer"
    When "EnemyPlayer" conferma l'eliminazione
    Then la kill è "confirmed"
    And il mio contatore kill aumenta
    And "EnemyPlayer" passa in stato "dead"
    And parte timer respawn

  Scenario: Kill contestata
    Given ho segnalato kill su "EnemyPlayer"
    When "EnemyPlayer" contesta l'eliminazione
    Then la kill passa in stato "disputed"
    And viene notificato l'arbitro (se presente)
    And la decisione è rimandata

  Scenario: Kill auto-confermata
    Given sono a 5 metri dal giocatore "EnemyPlayer"
    And la confidence calcolata è 0.98
    When segnalo l'eliminazione
    Then la kill è auto-confermata
    And non richiede conferma vittima

  Scenario: Fine partita
    Given il round 3 è terminato
    And il punteggio è Alpha 2 - Bravo 1
    When la partita termina
    Then lo stato diventa "ended"
    And viene calcolato ELO per tutti
    And viene generato match summary
    And vengono assegnati achievement
```

## 8.4 Referee Features

```gherkin
Feature: Referee Certification
  Come giocatore esperto
  Voglio ottenere il patentino arbitro
  Per poter arbitrare partite ufficiali

  Background:
    Given sono autenticato
    And ho giocato almeno 50 partite
    And il mio tier è almeno Silver

  Scenario: Richiesta patentino Livello 1
    When invio richiesta patentino Livello 1
    And allego documento identità
    And descrivo la mia motivazione
    And indico disponibilità weekend
    Then la richiesta viene registrata
    And lo stato è "pending"
    And ricevo conferma con tempi stimati

  Scenario: Requisiti non soddisfatti
    Given ho giocato solo 30 partite
    When provo a richiedere patentino
    Then ricevo errore "Requisiti non soddisfatti: minimo 50 partite"

  Scenario: Approvazione e scheduling esame
    Given sono admin
    And esiste richiesta patentino da "CandidatoArbitro"
    When approvo la richiesta
    And schedulo esame per data X
    Then il candidato riceve notifica
    And lo stato diventa "exam_scheduled"

  Scenario: Superamento esame
    Given ho esame schedulato
    When l'admin registra esito "passed"
    Then divento arbitro Livello 1
    And il mio ruolo include "referee"
    And posso accettare partite da arbitrare


Feature: Referee in Match
  Come arbitro assegnato
  Voglio gestire le dispute durante la partita
  Per garantire fair play

  Background:
    Given sono arbitro Livello 2
    And sono assegnato alla partita "Torneo Regionale"
    And la partita è in stato "active"

  Scenario: Visualizzazione completa
    When accedo alla vista arbitro
    Then vedo posizioni di tutti i giocatori
    And vedo tutti gli eventi in tempo reale
    And ho accesso ai controlli partita

  Scenario: Risoluzione conflitto kill
    Given esiste kill disputata tra "PlayerA" e "PlayerB"
    When esamino le posizioni GPS al momento dell'evento
    And decido che "PlayerA" ha ragione
    Then confermo la kill a favore di "PlayerA"
    And la kill diventa "confirmed"
    And viene loggata la mia decisione

  Scenario: Registrazione kill manuale
    Given osservo eliminazione non registrata
    When registro kill manualmente
    And indico killer "PlayerA" e vittima "PlayerB"
    Then la kill è creata con source "referee"
    And confidence è 1.0
    And non richiede conferma
```

## 8.5 Field Features

```gherkin
Feature: Field Registration
  Come gestore di campo
  Voglio registrare il mio campo sulla piattaforma
  Per attirare giocatori e organizzare eventi

  Scenario: Registrazione campo completa
    Given sono autenticato
    When compilo form registrazione campo con:
      | nome         | Campo Tactical Zone      |
      | tipo         | outdoor                  |
      | terreno      | woodland                 |
      | dimensione   | 30000 mq                 |
      | max_players  | 60                       |
      | indirizzo    | Via dei Boschi 1, Milano |
    And carico almeno 3 foto
    And carico permesso comunale
    And carico certificato assicurazione
    Then la richiesta viene inviata
    And lo stato è "pending_approval"
    And ricevo conferma

  Scenario: Approvazione campo
    Given sono admin
    And esiste richiesta campo "Campo Tactical Zone"
    When verifico documenti
    And approvo la richiesta
    Then il campo diventa "active"
    And appare nella mappa
    And il gestore riceve notifica

  Scenario: Richiesta informazioni aggiuntive
    Given sono admin
    And esiste richiesta campo incompleta
    When richiedo documenti aggiuntivi
    Then il gestore riceve notifica
    And lo stato diventa "under_review"
    And ha 14 giorni per rispondere
```

## 8.6 Admin Features

```gherkin
Feature: Admin Dashboard
  Come amministratore
  Voglio monitorare la piattaforma
  Per gestire utenti, campi e contenuti

  Background:
    Given sono autenticato come admin

  Scenario: Visualizzazione dashboard
    When accedo alla dashboard admin
    Then vedo statistiche:
      | utenti totali       |
      | utenti attivi oggi  |
      | partite in corso    |
      | campi pending       |
      | segnalazioni aperte |
    And vedo grafico registrazioni ultimi 30 giorni
    And vedo lista azioni urgenti

  Scenario: Ban utente
    Given esiste utente "Cheater123" con segnalazioni multiple
    When applico ban permanente
    And inserisco motivazione "Cheating confermato"
    Then l'utente viene disconnesso
    And non può più accedere
    And viene loggata l'azione
    And le sue statistiche vengono congelate

  Scenario: Gestione segnalazione
    Given esiste segnalazione contro "SuspectPlayer"
    When esamino i dettagli
    And decido che è fondata
    And applico warning
    Then l'utente riceve notifica warning
    And la segnalazione è chiusa
    And viene incrementato counter warning utente
```

---

# 9. DIAGRAMMI DI FLUSSO

## 9.1 User Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     USER REGISTRATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   START     │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │ Selezione   │
                              │ Metodo Auth │
                              └──────┬──────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             ┌───────────┐    ┌───────────┐    ┌───────────┐
             │  Google   │    │   Apple   │    │   Email   │
             └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                   │                │                │
                   ▼                ▼                ▼
             ┌───────────┐    ┌───────────┐    ┌───────────┐
             │OAuth Flow │    │OAuth Flow │    │ Form      │
             │           │    │           │    │ Email/Pwd │
             └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                             ┌──────▼──────┐
                             │  Validate   │
                             │  Input      │
                             └──────┬──────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                        ▼                       ▼
                   ┌─────────┐            ┌─────────┐
                   │ Invalid │            │  Valid  │
                   └────┬────┘            └────┬────┘
                        │                      │
                        ▼                      ▼
                   ┌─────────┐            ┌─────────────┐
                   │ Show    │            │ Check Email │
                   │ Errors  │            │ Exists      │
                   └────┬────┘            └──────┬──────┘
                        │                        │
                        ▼              ┌─────────┴─────────┐
                   ┌─────────┐         │                   │
                   │ Retry   │         ▼                   ▼
                   └─────────┘    ┌─────────┐        ┌─────────┐
                                  │ Exists  │        │  New    │
                                  └────┬────┘        └────┬────┘
                                       │                  │
                                       ▼                  ▼
                                  ┌─────────┐        ┌─────────────┐
                                  │ Error   │        │ Create User │
                                  │ Message │        │ Account     │
                                  └─────────┘        └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Step 2:     │
                                                    │ Profile     │
                                                    │ (username,  │
                                                    │  avatar,    │
                                                    │  region)    │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Step 3:     │
                                                    │ Experience  │
                                                    │ (optional)  │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Step 4:     │
                                                    │ Team Search │
                                                    │ (optional)  │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Generate    │
                                                    │ JWT Tokens  │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Send Welcome│
                                                    │ Email       │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │ Redirect to │
                                                    │ Dashboard   │
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │    END      │
                                                    └─────────────┘
```

## 9.2 Team Join Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TEAM JOIN REQUEST FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────┐                                              ┌───────────┐
│ Requester │                                              │  Leader   │
└─────┬─────┘                                              └─────┬─────┘
      │                                                          │
      │  Browse Teams                                            │
      │─────────────────┐                                        │
      │                 │                                        │
      │  ┌──────────────▼──────────────┐                        │
      │  │ Filter: recruiting, region, │                        │
      │  │ minElo                      │                        │
      │  └──────────────┬──────────────┘                        │
      │                 │                                        │
      │  Select Team    │                                        │
      │◄────────────────┘                                        │
      │                                                          │
      │  View Team Detail                                        │
      │─────────────────┐                                        │
      │                 │                                        │
      │  ┌──────────────▼──────────────┐                        │
      │  │ Check Requirements          │                        │
      │  │ • minElo: 1000             │                        │
      │  │ • minMatches: 20           │                        │
      │  │ • minKd: 1.5               │                        │
      │  └──────────────┬──────────────┘                        │
      │                 │                                        │
      │     ┌───────────┴───────────┐                           │
      │     │                       │                           │
      │     ▼                       ▼                           │
      │ ┌─────────┐           ┌─────────┐                       │
      │ │ FAIL    │           │ PASS    │                       │
      │ └────┬────┘           └────┬────┘                       │
      │      │                     │                            │
      │      ▼                     ▼                            │
      │ ┌─────────┐           ┌─────────────┐                   │
      │ │ Show    │           │ Show Join   │                   │
      │ │ Error   │           │ Form        │                   │
      │ └─────────┘           └──────┬──────┘                   │
      │                              │                          │
      │  Submit Request              │                          │
      │◄─────────────────────────────┘                          │
      │                                                          │
      │  ┌──────────────────────────────┐                       │
      │  │ Create Join Request          │                       │
      │  │ status: pending              │                       │
      │  └──────────────┬───────────────┘                       │
      │                 │                                        │
      │                 │  Notification                          │
      │                 │───────────────────────────────────────►│
      │                 │                                        │
      │                 │                    View Request         │
      │                 │◄───────────────────────────────────────│
      │                 │                                        │
      │                 │                    ┌───────────────────┐│
      │                 │                    │ Review Profile    ││
      │                 │                    │ • Stats           ││
      │                 │                    │ • History         ││
      │                 │                    │ • Message         ││
      │                 │                    └─────────┬─────────┘│
      │                 │                              │          │
      │                 │                ┌─────────────┴──────────┐
      │                 │                │                        │
      │                 │                ▼                        ▼
      │                 │          ┌─────────┐              ┌─────────┐
      │                 │          │ APPROVE │              │ REJECT  │
      │                 │          └────┬────┘              └────┬────┘
      │                 │               │                        │
      │  Notification   │               │      Notification      │
      │◄────────────────┼───────────────┘◄───────────────────────┘
      │                 │                                        │
      │  ┌──────────────┴──────────────┐                        │
      │  │ If Approved:                │                        │
      │  │ • Add to team members       │                        │
      │  │ • Update user role          │                        │
      │  │ • Notify team chat          │                        │
      │  │                             │                        │
      │  │ If Rejected:                │                        │
      │  │ • Set cooldown 7 days       │                        │
      │  │ • Store rejection reason    │                        │
      │  └─────────────────────────────┘                        │
      │                                                          │
      ▼                                                          ▼
```

## 9.3 Match Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MATCH LIFECYCLE FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  SCHEDULED  │────►│   LOBBY     │────►│   ACTIVE    │────►│   ENDED     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Players can │     │ Players     │     │ Gameplay    │     │ Stats       │
│ register    │     │ check-in    │     │ in progress │     │ calculated  │
│             │     │             │     │             │     │             │
│ Organizer   │     │ Teams       │     │ Kills       │     │ ELO updated │
│ can edit    │     │ assigned    │     │ tracked     │     │             │
│             │     │             │     │             │     │ Achievements│
│ Can cancel  │     │ Waiting for │     │ Real-time   │     │ awarded     │
│             │     │ min players │     │ updates     │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                                        ┌──────┴──────┐
                                        │             │
                                        ▼             ▼
                                  ┌─────────┐   ┌─────────┐
                                  │ PAUSED  │   │CANCELLED│
                                  └────┬────┘   └─────────┘
                                       │
                                       │ Resume
                                       │
                                       ▼
                                  ┌─────────┐
                                  │ ACTIVE  │
                                  └─────────┘


DETAILED ACTIVE STATE:

                              ┌─────────────┐
                              │   ACTIVE    │
                              └──────┬──────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
        ┌───────────┐          ┌───────────┐          ┌───────────┐
        │  ROUND 1  │─────────►│  ROUND 2  │─────────►│  ROUND N  │
        └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
              │                      │                      │
              │                      │                      │
    ┌─────────┼─────────┐  ┌─────────┼─────────┐  ┌─────────┼─────────┐
    │         │         │  │         │         │  │         │         │
    ▼         ▼         ▼  ▼         ▼         ▼  ▼         ▼         ▼
 ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
 │Kills │ │Moves │ │Obj   │ │Kills │ │Moves │ │Obj   │ │Kills │ │Moves │
 │Events│ │      │ │      │ │Events│ │      │ │      │ │Events│ │      │
 └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

## 9.4 Kill Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       KILL VALIDATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────┐           ┌───────────┐           ┌───────────┐
│  Killer   │           │  System   │           │  Victim   │
└─────┬─────┘           └─────┬─────┘           └─────┬─────┘
      │                       │                       │
      │  Claim Kill           │                       │
      │──────────────────────►│                       │
      │                       │                       │
      │                 ┌─────▼─────┐                 │
      │                 │ Calculate │                 │
      │                 │Confidence │                 │
      │                 └─────┬─────┘                 │
      │                       │                       │
      │         ┌─────────────┼─────────────┐        │
      │         │             │             │        │
      │         ▼             ▼             ▼        │
      │   ┌───────────┐ ┌───────────┐ ┌───────────┐  │
      │   │Conf > 0.95│ │0.7 < Conf │ │Conf < 0.7 │  │
      │   │           │ │   < 0.95  │ │           │  │
      │   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  │
      │         │             │             │        │
      │         ▼             │             ▼        │
      │   ┌───────────┐       │       ┌───────────┐  │
      │   │   AUTO    │       │       │ REQUIRES  │  │
      │   │ CONFIRM   │       │       │  REVIEW   │  │
      │   └─────┬─────┘       │       └───────────┘  │
      │         │             │                      │
      │         │             │  Request Confirm     │
      │         │             │─────────────────────►│
      │         │             │                      │
      │         │             │◄─────────────────────│
      │         │             │  Response            │
      │         │             │                      │
      │         │       ┌─────▼─────┐                │
      │         │       │ Response? │                │
      │         │       └─────┬─────┘                │
      │         │             │                      │
      │         │  ┌──────────┼──────────┐          │
      │         │  │          │          │          │
      │         │  ▼          ▼          ▼          │
      │         │┌──────┐ ┌──────┐ ┌──────────┐     │
      │         ││ACCEPT│ │DENY  │ │ TIMEOUT  │     │
      │         │└──┬───┘ └──┬───┘ │ (60 sec) │     │
      │         │   │        │     └────┬─────┘     │
      │         │   │        │          │           │
      │         ▼   ▼        ▼          ▼           │
      │      ┌────────────────────────────────┐     │
      │      │         KILL STATUS            │     │
      │      ├────────────────────────────────┤     │
      │      │ CONFIRMED │ DISPUTED │ PENDING │     │
      │      └─────┬──────────┬─────────┬─────┘     │
      │            │          │         │           │
      │            │          ▼         │           │
      │            │    ┌───────────┐   │           │
      │            │    │  REFEREE  │   │           │
      │            │    │  REVIEW   │   │           │
      │            │    └─────┬─────┘   │           │
      │            │          │         │           │
      │            ▼          ▼         ▼           │
      │      ┌────────────────────────────────┐     │
      │      │        UPDATE STATS            │     │
      │      │  • Killer: +1 kill             │     │
      │      │  • Victim: +1 death            │     │
      │      │  • Victim status: dead         │     │
      │      │  • Start respawn timer         │     │
      │      └────────────────────────────────┘     │
      │                                             │
      ▼                                             ▼
```

## 9.5 Referee Certification Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REFEREE CERTIFICATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────┐                ┌───────────┐                ┌───────────┐
│ Candidate │                │  System   │                │   Admin   │
└─────┬─────┘                └─────┬─────┘                └─────┬─────┘
      │                            │                            │
      │  Check Eligibility         │                            │
      │───────────────────────────►│                            │
      │                            │                            │
      │                      ┌─────▼─────┐                      │
      │                      │ Validate  │                      │
      │                      │ • 50+ matches                    │
      │                      │ • Silver+ tier                   │
      │                      │ • No bans                        │
      │                      └─────┬─────┘                      │
      │                            │                            │
      │              ┌─────────────┴─────────────┐              │
      │              │                           │              │
      │              ▼                           ▼              │
      │        ┌───────────┐              ┌───────────┐        │
      │        │  ELIGIBLE │              │NOT ELIGIBLE│        │
      │        └─────┬─────┘              └─────┬─────┘        │
      │              │                          │              │
      │              │                          ▼              │
      │              │                    ┌───────────┐        │
      │              │                    │Show Error │        │
      │◄─────────────┘                    │& Missing  │        │
      │                                   │Requirements│       │
      │  Submit Application               └───────────┘        │
      │───────────────────────────────────────────────────────►│
      │  • Level requested                                     │
      │  • Experience                                          │
      │  • Motivation                                          │
      │  • Documents                                           │
      │                                                        │
      │                                   ┌─────▼─────┐        │
      │                                   │  Review   │        │
      │                                   │Application│        │
      │                                   └─────┬─────┘        │
      │                                         │              │
      │                      ┌──────────────────┼──────────────┐
      │                      │                  │              │
      │                      ▼                  ▼              ▼
      │                ┌───────────┐      ┌───────────┐  ┌───────────┐
      │                │  APPROVE  │      │  REQUEST  │  │  REJECT   │
      │                │           │      │  MORE     │  │           │
      │                └─────┬─────┘      │  INFO     │  └─────┬─────┘
      │                      │            └─────┬─────┘        │
      │                      │                  │              │
      │  Notification        │◄─────────────────┴──────────────┘
      │◄─────────────────────┘
      │
      │  If Approved:
      │  ┌───────────────────────────────────────┐
      │  │ Schedule Exam                         │
      │  │ • Theory test (online)                │
      │  │ • Practical test (in-field)           │
      │  └───────────────────────────────────────┘
      │
      │  Take Exam
      │───────────────────────────────────────────────────────►│
      │                                                        │
      │                                   ┌─────▼─────┐        │
      │                                   │  Record   │        │
      │                                   │  Result   │        │
      │                                   └─────┬─────┘        │
      │                                         │              │
      │                            ┌────────────┴────────────┐ │
      │                            │                         │ │
      │                            ▼                         ▼ │
      │                      ┌───────────┐            ┌───────────┐
      │                      │  PASSED   │            │  FAILED   │
      │                      └─────┬─────┘            └─────┬─────┘
      │                            │                        │
      │  ┌─────────────────────────┘                        │
      │  │                                                  │
      │  ▼                                                  ▼
      │  ┌────────────────────────────┐   ┌────────────────────────────┐
      │  │ Grant Referee Badge        │   │ Can retry after 30 days   │
      │  │ • Update user role         │   │                            │
      │  │ • Add to referee pool      │   │                            │
      │  │ • Enable referee features  │   │                            │
      │  └────────────────────────────┘   └────────────────────────────┘
      │
      ▼
```

## 9.6 Field Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FIELD REGISTRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────┐                ┌───────────┐                ┌───────────┐
│  Manager  │                │  System   │                │   Admin   │
└─────┬─────┘                └─────┬─────┘                └─────┬─────┘
      │                            │                            │
      │  Start Registration        │                            │
      │───────────────────────────►│                            │
      │                            │                            │
      │  ┌─────────────────────────┴─────────────────────────┐  │
      │  │                                                    │  │
      │  │  STEP 1: Basic Info                               │  │
      │  │  • Name, Description                               │  │
      │  │  • Type (indoor/outdoor)                          │  │
      │  │  • Terrain type                                    │  │
      │  │  • Size, Max players                               │  │
      │  │                                                    │  │
      │  │  STEP 2: Location                                  │  │
      │  │  • Full address                                    │  │
      │  │  • Map pin selection                               │  │
      │  │  • Coordinates validation (Italy only)             │  │
      │  │                                                    │  │
      │  │  STEP 3: Facilities                                │  │
      │  │  • Services checklist                              │  │
      │  │  • Opening hours                                   │  │
      │  │  • Pricing                                         │  │
      │  │                                                    │  │
      │  │  STEP 4: Media                                     │  │
      │  │  • Upload min 3 photos                             │  │
      │  │  • Logo (optional)                                 │  │
      │  │                                                    │  │
      │  │  STEP 5: Documents                                 │  │
      │  │  • Municipal permit                                │  │
      │  │  • Insurance certificate                           │  │
      │  │  • Contact info                                    │  │
      │  │                                                    │  │
      │  └─────────────────────────┬─────────────────────────┘  │
      │                            │                            │
      │  Submit                    │                            │
      │───────────────────────────►│                            │
      │                            │                            │
      │                      ┌─────▼─────┐                      │
      │                      │ Validate  │                      │
      │                      │ All Data  │                      │
      │                      └─────┬─────┘                      │
      │                            │                            │
      │              ┌─────────────┴─────────────┐              │
      │              │                           │              │
      │              ▼                           ▼              │
      │        ┌───────────┐              ┌───────────┐        │
      │        │   VALID   │              │  INVALID  │        │
      │        └─────┬─────┘              └─────┬─────┘        │
      │              │                          │              │
      │              │                          ▼              │
      │              │                    ┌───────────┐        │
      │              │                    │Show Errors│        │
      │◄─────────────┴────────────────────│& Fix      │        │
      │                                   └───────────┘        │
      │                                                        │
      │  Create Request                                        │
      │───────────────────────────────────────────────────────►│
      │  status: pending                                       │
      │                                                        │
      │                                   ┌─────▼─────┐        │
      │                                   │  Review   │        │
      │                                   │ Documents │        │
      │                                   └─────┬─────┘        │
      │                                         │              │
      │                      ┌──────────────────┼──────────────┐
      │                      │                  │              │
      │                      ▼                  ▼              ▼
      │                ┌───────────┐      ┌───────────┐  ┌───────────┐
      │                │  APPROVE  │      │  REQUEST  │  │  REJECT   │
      │                │           │      │  CHANGES  │  │           │
      │                └─────┬─────┘      └─────┬─────┘  └─────┬─────┘
      │                      │                  │              │
      │  Notification        │◄─────────────────┴──────────────┘
      │◄─────────────────────┘
      │
      │  If Approved:
      │  ┌────────────────────────────────────────────────────┐
      │  │ • Field status → active                            │
      │  │ • Visible on map                                    │
      │  │ • Can receive bookings                              │
      │  │ • Manager gets field_manager role                   │
      │  └────────────────────────────────────────────────────┘
      │
      │  If Request Changes:
      │  ┌────────────────────────────────────────────────────┐
      │  │ • 14 days to respond                                │
      │  │ • If no response → auto-reject                      │
      │  └────────────────────────────────────────────────────┘
      │
      ▼
```

---

# 10. NON-FUNCTIONAL REQUIREMENTS

## 10.1 Performance

| Metrica | Target | Note |
|---------|--------|------|
| API Response Time (P95) | < 200ms | Escluse operazioni bulk |
| API Response Time (P99) | < 500ms | |
| WebSocket Latency | < 100ms | Per messaggi real-time |
| Database Query Time | < 50ms | Query standard |
| Throughput | 1000 req/s | Per istanza |
| Concurrent WebSocket | 10,000 | Per istanza |

## 10.2 Scalability

| Componente | Strategia |
|------------|-----------|
| API Server | Horizontal scaling con load balancer |
| WebSocket | Sticky sessions + Redis pub/sub |
| Database | Read replicas + connection pooling |
| Cache | Redis Cluster |
| Storage | S3/CDN per assets statici |
| Queue | Partitioned by job type |

## 10.3 Availability

| Metrica | Target |
|---------|--------|
| Uptime | 99.9% |
| RTO (Recovery Time Objective) | < 1 ora |
| RPO (Recovery Point Objective) | < 5 minuti |
| Backup Frequency | Ogni 6 ore |
| Backup Retention | 30 giorni |

## 10.4 Security

| Area | Requisito |
|------|-----------|
| Autenticazione | JWT con refresh token rotation |
| Password | bcrypt con cost factor 12 |
| Transport | TLS 1.3 obbligatorio |
| Rate Limiting | 100 req/min per IP, 1000 req/min per utente |
| Input Validation | Zod schema validation su tutti gli endpoint |
| SQL Injection | Prepared statements (ORM) |
| XSS | Sanitizzazione output, CSP headers |
| CORS | Whitelist domini autorizzati |
| File Upload | Validazione MIME, max 10MB, scan antivirus |
| Audit | Log tutte le operazioni sensibili |
| GDPR | Pseudonimizzazione, diritto all'oblio |

## 10.5 Monitoring & Observability

| Tipo | Strumento Consigliato |
|------|----------------------|
| Metrics | Prometheus + Grafana |
| Logging | ELK Stack / Loki |
| Tracing | Jaeger / OpenTelemetry |
| APM | New Relic / Datadog |
| Error Tracking | Sentry |
| Uptime | Pingdom / UptimeRobot |

## 10.6 Testing Requirements

| Tipo | Coverage Target | Note |
|------|-----------------|------|
| Unit Tests | > 80% | Business logic |
| Integration Tests | > 60% | API endpoints |
| E2E Tests | Critical paths | Auth, Match, Payment |
| Load Tests | Quarterly | Simulate 10x normal load |
| Security Tests | Monthly | OWASP Top 10 |

---

# APPENDICE A: GLOSSARIO

| Termine | Definizione |
|---------|-------------|
| ELO | Sistema di rating per classificare i giocatori |
| Tier | Livello di ranking (Bronze → Diamond) |
| Kill | Eliminazione di un avversario |
| Match | Partita organizzata |
| Round | Singolo turno di una partita |
| CTF | Capture The Flag - modalità di gioco |
| TDM | Team Deathmatch - modalità di gioco |
| Field | Campo da gioco |
| Referee | Arbitro certificato |
| Confidence | Score di affidabilità per auto-validazione kill |

---

# APPENDICE B: VERSIONING

| Versione | Data | Autore | Modifiche |
|----------|------|--------|-----------|
| 1.0 | Dec 2024 | TicOps Team | Versione iniziale |

---

*Documento generato per sviluppo con AI Agents (Copilot/Claude)*
*Ultima modifica: Dicembre 2024*
