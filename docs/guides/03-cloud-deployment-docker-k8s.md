# Platformatic Watt - Deployment Cloud

> **Prima di deployare, chiediti**: Questo deploy aggiunge valore reale? È la soluzione più semplice
> che funziona? Ho considerato i costi operativi a lungo termine?

---

## Indice

1. [Filosofia del Deploy](#filosofia-del-deploy)
2. [Dockerizzazione](#dockerizzazione)
3. [Kubernetes](#kubernetes)
4. [Piattaforme PaaS](#piattaforme-paas)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring e Observability](#monitoring-e-observability)

---

## Filosofia del Deploy

### Il Deploy come Feature

Ogni deploy dovrebbe essere un evento banale, non un'impresa eroica. Se il deploy è stressante,
qualcosa nel processo è sbagliato. L'obiettivo è raggiungere un punto dove deployare è così
routinario che puoi farlo più volte al giorno senza ansia.

Questo richiede tre cose: automazione completa (nessun step manuale), rollback istantaneo (se
qualcosa va storto, torni indietro in secondi), e feedback rapido (sai subito se funziona o no).

### Il Principio del Valore Incrementale

Ogni deploy deve aggiungere valore. Non deployare "preparazioni" o "infrastruttura per future
feature". Se non puoi spiegare a un utente cosa migliora con questo deploy, forse non dovresti
farlo.

Questo si collega al concetto XP di timebox piccoli e deployabili: ogni unità di lavoro deve essere
completa e utile di per sé.

---

## Dockerizzazione

### Dockerfile Ottimizzato per Watt

Il Dockerfile per un'applicazione Watt deve bilanciare dimensione dell'immagine, tempo di build, e
sicurezza. Ecco un esempio commentato che segue le best practice.

```dockerfile
# ==============================================================================
# STAGE 1: Dependencies
# Installa solo le dipendenze, sfruttando la cache di Docker per build veloci
# ==============================================================================
FROM node:22-alpine AS deps

# Domanda: perché Alpine?
# Risposta: immagine base più piccola (~50MB vs ~1GB per l'immagine full)
# Trade-off: alcune librerie native potrebbero richiedere compilazione

WORKDIR /app

# Copia solo i file necessari per npm install
# Questo massimizza l'uso della cache: se package.json non cambia,
# questo layer viene riusato anche se il codice cambia
COPY package*.json ./
COPY web/*/package*.json ./web/

# Installa dipendenze di produzione
# --omit=dev esclude le devDependencies, riducendo la dimensione
RUN npm ci --omit=dev

# ==============================================================================
# STAGE 2: Builder
# Compila TypeScript e prepara gli asset di produzione
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copia le dipendenze dallo stage precedente
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/*/node_modules ./web/

# Copia il codice sorgente
COPY . .

# Build di produzione
# Questo compila TypeScript, ottimizza frontend, etc.
RUN npm run build

# ==============================================================================
# STAGE 3: Runner
# Immagine finale minimale per l'esecuzione
# ==============================================================================
FROM node:22-alpine AS runner

# Security: non eseguire come root
# Questo limita i danni in caso di compromissione
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 watt

WORKDIR /app

# Copia solo ciò che serve per l'esecuzione
COPY --from=builder --chown=watt:nodejs /app/dist ./dist
COPY --from=builder --chown=watt:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=watt:nodejs /app/watt.json ./
COPY --from=builder --chown=watt:nodejs /app/web/*/dist ./web/
COPY --from=builder --chown=watt:nodejs /app/web/*/watt.json ./web/
COPY --from=builder --chown=watt:nodejs /app/web/*/platformatic.json ./web/

# Passa all'utente non-root
USER watt

# Esponi la porta (documentazione, non apre effettivamente la porta)
EXPOSE 3042

# Variabili d'ambiente di default
# Possono essere sovrascritte al runtime con -e
ENV NODE_ENV=production
ENV PORT=3042
ENV HOSTNAME=0.0.0.0

# Health check integrato
# Docker/Kubernetes useranno questo per verificare che l'app sia viva
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3042/health || exit 1

# Comando di avvio
CMD ["npx", "wattpm", "start"]
```

### Docker Compose per Sviluppo Locale

Docker Compose permette di replicare l'ambiente di produzione in locale, inclusi database e servizi
esterni.

```yaml
# docker-compose.yml
# Domanda: mi serve tutto questo in locale?
# Risposta: dipende. Per sviluppo quotidiano, spesso basta SQLite.
# Usa questo setup per test di integrazione o debugging di problemi prod-like.

version: '3.8'

services:
  # L'applicazione Watt principale
  watt:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner # Usa lo stage finale
    ports:
      - '3042:3042'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://watt:watt@postgres:5432/watt_dev
      - LOG_LEVEL=debug
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    # Mount del codice per hot-reload in sviluppo
    volumes:
      - ./web:/app/web:ro
    # Override del comando per modalità sviluppo
    command: ['npx', 'wattpm', 'dev']

  # Database PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: watt
      POSTGRES_PASSWORD: watt
      POSTGRES_DB: watt_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U watt']
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis per caching/sessioni
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### .dockerignore

Un buon `.dockerignore` riduce il context di build e previene leak di informazioni sensibili.

```
# Dipendenze (vengono installate nel container)
node_modules
*/node_modules

# File di sviluppo
.git
.gitignore
.env
.env.*
!.env.sample

# Build artifacts
dist
*/dist
*.log

# IDE e editor
.vscode
.idea
*.swp

# Test e documentazione
coverage
docs
*.md
!README.md

# Docker stesso
Dockerfile*
docker-compose*
.dockerignore
```

---

## Kubernetes

### Domanda Preliminare: Mi Serve Kubernetes?

Prima di adottare Kubernetes, chiediti onestamente: ne ho davvero bisogno? Kubernetes aggiunge
complessità significativa. È giustificato se hai bisogno di scalabilità automatica basata su
metriche, alta disponibilità con self-healing, gestione di molti servizi con networking complesso, o
deployment in più regioni/cloud.

Se hai un'applicazione monolitica o un piccolo set di servizi, una piattaforma PaaS (Railway,
Render, Fly.io) potrebbe essere più appropriata. KISS: usa lo strumento più semplice che risolve il
problema.

### Manifesti Kubernetes per Watt

Se hai determinato che Kubernetes è appropriato, ecco i manifesti fondamentali.

```yaml
# k8s/namespace.yaml
# Isola le risorse dell'applicazione in un namespace dedicato
apiVersion: v1
kind: Namespace
metadata:
  name: watt-healthcare
  labels:
    app: watt-healthcare
    environment: production
```

```yaml
# k8s/configmap.yaml
# Configurazioni non sensibili
# Domanda: questa config cambierà spesso? Se sì, considera un sistema di config management
apiVersion: v1
kind: ConfigMap
metadata:
  name: watt-config
  namespace: watt-healthcare
data:
  LOG_LEVEL: 'info'
  CORS_ORIGIN: 'https://app.example.com'
  # Non mettere qui informazioni sensibili!
```

```yaml
# k8s/secrets.yaml
# Informazioni sensibili (in produzione, usa un secret manager esterno)
# NOTA: questo file NON va committato! È solo un esempio.
apiVersion: v1
kind: Secret
metadata:
  name: watt-secrets
  namespace: watt-healthcare
type: Opaque
stringData:
  DATABASE_URL: 'postgres://user:password@host:5432/db'
  JWT_SECRET: 'your-super-secret-key'
```

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: watt-api
  namespace: watt-healthcare
  labels:
    app: watt-api
spec:
  # Numero di repliche
  # Domanda: quante ne servono veramente? Inizia con 2 per HA, scala se necessario
  replicas: 2

  # Strategia di deploy: RollingUpdate per zero-downtime
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # Massimo 1 pod extra durante l'update
      maxUnavailable: 0 # Sempre almeno N pod disponibili

  selector:
    matchLabels:
      app: watt-api

  template:
    metadata:
      labels:
        app: watt-api
    spec:
      # Security context: non-root, filesystem read-only dove possibile
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      containers:
        - name: watt
          image: your-registry/watt-healthcare:latest

          # Risorse: definisci sempre limiti!
          # Senza limiti, un pod può consumare tutte le risorse del nodo
          resources:
            requests:
              memory: '256Mi'
              cpu: '100m'
            limits:
              memory: '512Mi'
              cpu: '500m'

          ports:
            - containerPort: 3042
              name: http

          # Environment da ConfigMap e Secrets
          envFrom:
            - configMapRef:
                name: watt-config
            - secretRef:
                name: watt-secrets

          # Probes: fondamentali per la resilienza

          # Liveness: l'app è viva?
          # Se fallisce, Kubernetes riavvia il pod
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15
            timeoutSeconds: 3
            failureThreshold: 3

          # Readiness: l'app è pronta a ricevere traffico?
          # Se fallisce, Kubernetes smette di inviare richieste
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          # Startup: per app con avvio lento
          # Previene che liveness/readiness falliscano durante lo startup
          startupProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 0
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 30 # 30 * 5s = 2.5 minuti max per avviarsi
```

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: watt-api
  namespace: watt-healthcare
spec:
  selector:
    app: watt-api
  ports:
    - port: 80
      targetPort: http
      name: http
  type: ClusterIP # Interno al cluster, esposto via Ingress
```

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: watt-api
  namespace: watt-healthcare
  annotations:
    # Cert-manager per TLS automatico
    cert-manager.io/cluster-issuer: letsencrypt-prod
    # Rate limiting se usi nginx-ingress
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: watt-api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: watt-api
                port:
                  name: http
```

### Health Check Endpoints in Watt

Per supportare i probe di Kubernetes, implementa endpoint di health check appropriati.

```typescript
// web/api-core/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Liveness: l'applicazione è in esecuzione?
  // Non controllare dipendenze esterne qui!
  // Se il database è giù ma l'app funziona, non vuoi che Kubernetes riavvii l'app
  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Readiness: l'applicazione è pronta a ricevere richieste?
  // Qui controlli le dipendenze: database, cache, servizi esterni critici
  @Get('ready')
  async readiness() {
    const checks = await this.healthService.checkDependencies();

    const allHealthy = checks.every((c) => c.healthy);

    if (!allHealthy) {
      // Ritorna 503 se qualche dipendenza non è disponibile
      throw new ServiceUnavailableException({
        status: 'not ready',
        checks,
      });
    }

    return { status: 'ready', checks };
  }
}

// web/api-core/src/health/health.service.ts
@Injectable()
export class HealthService {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly redis: RedisConnection
  ) {}

  async checkDependencies() {
    return Promise.all([this.checkDatabase(), this.checkRedis()]);
  }

  private async checkDatabase() {
    try {
      await this.db.query('SELECT 1');
      return { name: 'database', healthy: true };
    } catch (error) {
      return { name: 'database', healthy: false, error: error.message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { name: 'redis', healthy: true };
    } catch (error) {
      return { name: 'redis', healthy: false, error: error.message };
    }
  }
}
```

---

## Piattaforme PaaS

### Quando Preferire PaaS a Kubernetes

Le piattaforme PaaS (Platform as a Service) come Railway, Render, Fly.io, o Heroku offrono
un'alternativa più semplice a Kubernetes. Sono appropriate quando la semplicità operativa è più
importante della flessibilità totale, quando il team è piccolo e non ha expertise Kubernetes, quando
l'applicazione ha requisiti di scaling prevedibili, o quando si vuole ridurre il time-to-market.

### Deploy su Railway

Railway è una piattaforma moderna che supporta bene le applicazioni Node.js.

```toml
# railway.toml
[build]
builder = "dockerfile"
dockerfilePath = "./Dockerfile"

[deploy]
healthcheckPath = "/health/live"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Le variabili d'ambiente si configurano dalla dashboard di Railway o via CLI.

```bash
# Configura le variabili per l'ambiente di produzione
railway variables set DATABASE_URL="postgres://..."
railway variables set LOG_LEVEL="info"
railway variables set JWT_SECRET="..."
```

### Deploy su Fly.io

Fly.io è ottimo per applicazioni che devono essere vicine agli utenti geograficamente.

```toml
# fly.toml
app = "watt-healthcare"
primary_region = "fra"  # Frankfurt per utenti EU

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3042"
  NODE_ENV = "production"

[http_service]
  internal_port = 3042
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type = "connections"
    hard_limit = 100
    soft_limit = 80

[[services]]
  protocol = "tcp"
  internal_port = 3042

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = "15s"
    timeout = "5s"
    path = "/health/live"
```

---

## CI/CD Pipeline

### GitHub Actions per Watt

Una pipeline CI/CD ben fatta automatizza tutto: test, build, deploy. L'obiettivo è che ogni push a
main produca automaticamente un deploy se tutti i controlli passano.

```yaml
# .github/workflows/deploy.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==========================================================================
  # Job 1: Test
  # Esegue tutti i test prima di procedere
  # ==========================================================================
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()

  # ==========================================================================
  # Job 2: Build
  # Costruisce e pusha l'immagine Docker
  # ==========================================================================
  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==========================================================================
  # Job 3: Deploy to Staging
  # Deploy automatico a staging per ogni push a main
  # ==========================================================================
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          # Esempio con kubectl
          kubectl set image deployment/watt-api \
            watt=${{ needs.build.outputs.image_tag }} \
            --namespace=watt-staging

          kubectl rollout status deployment/watt-api \
            --namespace=watt-staging \
            --timeout=5m

      - name: Run smoke tests
        run: |
          # Verifica che l'app risponda
          curl -f https://staging.example.com/health/live

          # Test funzionale base
          npm run test:smoke -- --baseUrl=https://staging.example.com

  # ==========================================================================
  # Job 4: Deploy to Production
  # Richiede approvazione manuale
  # ==========================================================================
  deploy-production:
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production # Richiede approvazione in GitHub

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          kubectl set image deployment/watt-api \
            watt=${{ needs.build.outputs.image_tag }} \
            --namespace=watt-production

          kubectl rollout status deployment/watt-api \
            --namespace=watt-production \
            --timeout=5m

      - name: Verify deployment
        run: |
          curl -f https://api.example.com/health/live

      - name: Notify success
        if: success()
        run: |
          # Notifica su Slack/Teams/etc
          echo "Deployment successful!"
```

---

## Monitoring e Observability

### I Tre Pilastri dell'Observability

L'observability si basa su tre pilastri: logs (cosa è successo), metriche (quanto/quanti), e traces
(come è successo attraverso i servizi).

### Prometheus e Grafana con Watt

Per esporre metriche Prometheus da un'applicazione NestJS in Watt, puoi usare il pacchetto
`prom-client`.

```typescript
// web/api-core/src/metrics/metrics.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new client.Registry();

  // Metriche custom
  public readonly httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  });

  public readonly activeConnections = new client.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  });

  public readonly businessEvents = new client.Counter({
    name: 'business_events_total',
    help: 'Total number of business events',
    labelNames: ['event_type'],
  });

  onModuleInit() {
    // Registra metriche di default (CPU, memoria, etc)
    client.collectDefaultMetrics({ register: this.registry });

    // Registra metriche custom
    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.activeConnections);
    this.registry.registerMetric(this.businessEvents);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

// Controller per esporre le metriche
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.metricsService.getMetrics());
  }
}
```

### Structured Logging con Pino

Watt usa Pino di default, che produce log JSON strutturati. Per log più utili, aggiungi contesto.

```typescript
// web/api-core/src/logging/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || uuidv4();
    const startTime = Date.now();

    // Aggiungi il request ID al contesto per tutti i log successivi
    request.requestId = requestId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          console.log(
            JSON.stringify({
              level: 'info',
              requestId,
              method: request.method,
              path: request.path,
              statusCode: context.switchToHttp().getResponse().statusCode,
              duration,
              userId: request.user?.id,
            })
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          console.log(
            JSON.stringify({
              level: 'error',
              requestId,
              method: request.method,
              path: request.path,
              error: error.message,
              stack: error.stack,
              duration,
              userId: request.user?.id,
            })
          );
        },
      })
    );
  }
}
```

---

## Checklist Pre-Deploy

Prima di ogni deploy, verifica questi punti.

**Qualità del Codice**

- [ ] Tutti i test passano?
- [ ] Il linter non segnala errori?
- [ ] La code review è stata completata?

**Valore del Deploy**

- [ ] Questo deploy aggiunge valore misurabile?
- [ ] Posso spiegare cosa cambia a un non-tecnico?
- [ ] È la soluzione più semplice che funziona?

**Sicurezza**

- [ ] Nessun secret hardcoded nel codice?
- [ ] Le dipendenze sono aggiornate e senza vulnerabilità note?
- [ ] I permessi sono configurati secondo il principio del minimo privilegio?

**Operatività**

- [ ] Gli health check funzionano?
- [ ] I log contengono informazioni utili per il debugging?
- [ ] Il rollback è stato testato?
- [ ] Il monitoring è configurato per rilevare problemi?

**Documentazione**

- [ ] Le breaking change sono documentate?
- [ ] Le nuove variabili d'ambiente sono nel .env.sample?
- [ ] Il README è aggiornato se necessario?
