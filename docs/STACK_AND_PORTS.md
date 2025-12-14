# Stack Tecnologico e Configurazione Porte

## Principio Fondamentale

**REGOLA ZERO per Environment Variables:**
- ❌ **MAI** valori hardcoded in config/docker/script
- ✅ **SEMPRE** variabili d'ambiente con fallback ai default della tecnologia
- ✅ Tutti i valori configurabili devono essere esternalizzati in `.env`
- ✅ `.env.example` deve documentare tutte le variabili richieste

## Stack Tecnologico

### 1. Platformatic Watt (Application Server)

| Componente | Porta Default | Variabile Env | Descrizione |
|------------|---------------|---------------|-------------|
| Server HTTP | 3042 | `PORT` o `PLT_SERVER_PORT` | Server principale Watt |
| Hostname | 0.0.0.0 | `PLT_SERVER_HOSTNAME` | Bind address |
| Log Level | info | `PLT_SERVER_LOGGER_LEVEL` | Livello logging (trace, debug, info, warn, error) |
| Management API | false | `PLT_MANAGEMENT_API` | API gestione Platformatic |

**Routing interno (plt.local DNS):**
- `http://thc-gateway.plt.local` - Gateway (entrypoint)
- `http://thc-db.plt.local` - Database API
- `http://thc-service.plt.local` - Business Logic Service
- `http://thc-node.plt.local` - Node.js Service

### 2. PostgreSQL (Database)

| Parametro | Porta Default | Variabile Env | Descrizione |
|-----------|---------------|---------------|-------------|
| Port | 5432 | `POSTGRES_PORT` | Porta esposta PostgreSQL |
| Host | localhost | `POSTGRES_HOST` | Host PostgreSQL |
| User | postgres | `POSTGRES_USER` | Username database |
| Password | - | `POSTGRES_PASSWORD` | **REQUIRED** - Password database |
| Database | thc_db | `POSTGRES_DB` | Nome database |
| Connection String | - | `DATABASE_URL` | URL completo `postgres://user:pass@host:port/db` |

**Docker Image:** `postgres:16-alpine`  
**Container Name:** Usa `COMPOSE_PROJECT_NAME` prefix

### 3. Redis (Caching - Future)

| Parametro | Porta Default | Variabile Env | Descrizione |
|-----------|---------------|---------------|-------------|
| Port | 6379 | `REDIS_PORT` | Porta Redis |
| Host | localhost | `REDIS_HOST` | Host Redis |
| Connection String | - | `REDIS_URL` | `redis://host:port` |
| Password | - | `REDIS_PASSWORD` | Password (opzionale) |

**Docker Image:** `redis:7-alpine`  
**Status:** Non ancora implementato

### 4. Keycloak (Authentication - Future)

| Parametro | Porta Default | Variabile Env | Descrizione |
|-----------|---------------|---------------|-------------|
| Port | 8080 | `KEYCLOAK_PORT` | Porta Keycloak |
| Admin Port | 9000 | `KEYCLOAK_ADMIN_PORT` | Admin console |
| Admin User | admin | `KEYCLOAK_ADMIN` | Username admin |
| Admin Password | - | `KEYCLOAK_ADMIN_PASSWORD` | **REQUIRED** |
| Realm | thc | `KEYCLOAK_REALM` | Realm applicazione |
| URL | - | `KEYCLOAK_URL` | URL completo |

**Docker Image:** `quay.io/keycloak/keycloak:latest`  
**Status:** Non ancora implementato

### 5. Testcontainers (Solo Test)

| Componente | Porta | Variabile Env | Descrizione |
|------------|-------|---------------|-------------|
| PostgreSQL Test | Random | Gestito da Testcontainers | Porta dinamica per test |
| Docker Socket | /var/run/docker.sock | - | Socket Docker richiesto |

**Requisito:** Docker daemon in esecuzione

## Mappa Porte - Prevenzione Conflitti

### Porte Utilizzate

```
3042  - Platformatic Watt Server (PORT)
5432  - PostgreSQL Development (POSTGRES_PORT)
6379  - Redis (future) (REDIS_PORT)
8080  - Keycloak (future) (KEYCLOAK_PORT)
9000  - Keycloak Admin (future) (KEYCLOAK_ADMIN_PORT)
```

### Verifica Conflitti

```bash
# Controlla porte in uso
sudo lsof -i :3042
sudo lsof -i :5432
sudo lsof -i :6379
sudo lsof -i :8080
sudo lsof -i :9000

# Oppure con netstat
netstat -tuln | grep -E '3042|5432|6379|8080|9000'

# Oppure con ss
ss -tuln | grep -E '3042|5432|6379|8080|9000'
```

### Cambio Porte in Caso di Conflitto

Modifica `.env`:

```bash
# Esempio: PostgreSQL già in uso su 5432
POSTGRES_PORT=5433
DATABASE_URL=postgres://thc_user:thc_password@localhost:5433/thc_db

# Esempio: Watt già in uso su 3042
PORT=3043
```

## Variabili d'Ambiente - Template Completo

### `.env` (Development)

```bash
# === Platformatic Watt ===
PORT=3042
PLT_SERVER_HOSTNAME=0.0.0.0
PLT_SERVER_LOGGER_LEVEL=info
PLT_MANAGEMENT_API=false

# === PostgreSQL ===
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=thc_user
POSTGRES_PASSWORD=thc_password_dev_CHANGE_IN_PROD
POSTGRES_DB=thc_db
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# Per Platformatic DB
PLT_THC_DB_DATABASE_URL=${DATABASE_URL}
PLT_THC_DB_APPLY_MIGRATIONS=true

# === Redis (Future) ===
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
# REDIS_URL=redis://${REDIS_HOST}:${REDIS_PORT}

# === Keycloak (Future) ===
# KEYCLOAK_HOST=localhost
# KEYCLOAK_PORT=8080
# KEYCLOAK_ADMIN_PORT=9000
# KEYCLOAK_ADMIN=admin
# KEYCLOAK_ADMIN_PASSWORD=admin_password_CHANGE_IN_PROD
# KEYCLOAK_REALM=thc
# KEYCLOAK_URL=http://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}

# === Docker Compose ===
COMPOSE_PROJECT_NAME=thc
```

### `.env.example` (Template per Team)

```bash
# === Platformatic Watt ===
PORT=3042
PLT_SERVER_HOSTNAME=0.0.0.0
PLT_SERVER_LOGGER_LEVEL=info
PLT_MANAGEMENT_API=false

# === PostgreSQL ===
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=thc_user
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=thc_db
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

PLT_THC_DB_DATABASE_URL=${DATABASE_URL}
PLT_THC_DB_APPLY_MIGRATIONS=true

# === Docker Compose ===
COMPOSE_PROJECT_NAME=thc
```

### `.env.test` (CI/CD)

```bash
# Testcontainers gestisce automaticamente PostgreSQL
# Nessuna configurazione manuale necessaria
PORT=3042
PLT_SERVER_LOGGER_LEVEL=warn
```

### `.env.production` (NON committare!)

```bash
PORT=${PORT}  # Da configurare su piattaforma hosting
PLT_SERVER_HOSTNAME=0.0.0.0
PLT_SERVER_LOGGER_LEVEL=warn
PLT_MANAGEMENT_API=false

# PostgreSQL - Da servizio cloud
DATABASE_URL=${DATABASE_URL}  # Fornito da Render/Railway/etc
PLT_THC_DB_DATABASE_URL=${DATABASE_URL}
PLT_THC_DB_APPLY_MIGRATIONS=true

# Redis - Da servizio cloud
REDIS_URL=${REDIS_URL}  # Fornito da Upstash/Redis Cloud

# Keycloak
KEYCLOAK_URL=${KEYCLOAK_URL}
KEYCLOAK_REALM=${KEYCLOAK_REALM}
```

## Docker Compose - Best Practices

### Usare Variabili d'Ambiente

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ${COMPOSE_PROJECT_NAME:-thc}-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}
      POSTGRES_DB: ${POSTGRES_DB:-thc_db}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
```

**Sintassi:**
- `${VAR}` - Usa variabile o errore se non esiste
- `${VAR:-default}` - Usa variabile o default
- `${VAR:?error message}` - Usa variabile o fallisce con messaggio

## Scripts Package.json - Best Practices

### ❌ SBAGLIATO (Hardcoded)

```json
{
  "scripts": {
    "dev": "wattpm dev --port 3042",
    "db:up": "docker compose up postgres -d"
  }
}
```

### ✅ CORRETTO (Con Variabili)

```json
{
  "scripts": {
    "dev": "wattpm dev",
    "db:up": "docker compose up -d",
    "db:down": "docker compose down"
  }
}
```

Le porte/config vengono lette da `.env` automaticamente da:
- Platformatic Watt → Legge da `.env` via `watt.json`
- Docker Compose → Legge da `.env` automaticamente

## Checklist Configurazione

- [ ] `.env` creato con tutti i valori
- [ ] `.env.example` aggiornato (senza password reali)
- [ ] `.env` aggiunto a `.gitignore`
- [ ] `docker-compose.yml` usa `${VAR:-default}` syntax
- [ ] `watt.json` usa `{VARIABLE_NAME}` syntax
- [ ] Nessun valore hardcoded in script npm
- [ ] README documenta variabili richieste
- [ ] Porte verificate per conflitti

## Strumenti Utili

### Validazione .env

```bash
# Controlla variabili mancanti
docker compose config

# Test senza avviare
docker compose up --dry-run
```

### Debug Variabili

```bash
# Mostra tutte le variabili caricate
docker compose config | grep -A 5 environment

# In Node.js
console.log(process.env.DATABASE_URL)
```

## Riferimenti

- [Platformatic Environment Variables](https://docs.platformatic.dev/docs/reference/configuration#environment-variables)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [The Twelve-Factor App - Config](https://12factor.net/config)
