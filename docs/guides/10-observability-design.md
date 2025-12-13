# Observability & Monitoring Design - Tech Citizen Gateway

> **Extracted**: 2025-12-13  
> **Status**: Design Reference (v1 custom implementation)  
> **Purpose**: Document architectural decisions, data flows, and progressive enhancement strategy

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Progressive Enhancement (L0 → L3)](#progressive-enhancement)
4. [Metrics Design](#metrics-design)
5. [Logging Design](#logging-design)
6. [Tracing Design](#tracing-design)
7. [Correlation Strategy](#correlation-strategy)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Configuration Decisions](#configuration-decisions)
10. [Query Examples](#query-examples)

---

## Overview

### Vision

**Three Pillars of Observability**:

- 📊 **Metrics** - Aggregated time-series data (what's happening?)
- 📝 **Logs** - Discrete event records (what happened?)
- 🔍 **Traces** - Request flow across services (where's the bottleneck?)

**Design Principles**:

1. **Progressive Enhancement** - L0 (basic) → L3 (full observability)
2. **Configuration over Code** - Leverage Platformatic built-in features
3. **Correlation-First** - Link metrics, logs, traces via common IDs
4. **Resource-Aware** - Each level adds controlled overhead (512MB/1GB/500MB)

### Success Metrics

- ✅ P50/P95/P99 latency tracking (< 100ms/300ms/500ms targets)
- ✅ Error rate monitoring (< 1% target)
- ✅ Log aggregation with 7-day retention
- ✅ Distributed tracing with 48h retention
- ✅ Full-stack dashboards (app + infrastructure)

---

## Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   GATEWAY   │ (Platformatic Watt + Fastify)
└─────────────┘
       │
       ├──▶ /metrics (port 3042 or 9090) ──▶ Prometheus
       │                                          │
       ├──▶ stdout (JSON logs) ──▶ Promtail ──▶ Loki
       │                                          │
       └──▶ OTLP traces ──▶ OTEL Collector ──▶ Tempo
                                                  │
                    ┌─────────────────────────────┴────────┐
                    │                                      │
                    ▼                                      ▼
              ┌──────────┐                          ┌──────────┐
              │ GRAFANA  │◀─────────────────────────│ Datasrcs │
              └──────────┘                          └──────────┘
                    │                                      │
                    └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE MONITORING (L3)                                  │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐          ┌──────────────┐
    │ Node Exporter│──────────│   cAdvisor   │
    └──────────────┘          └──────────────┘
           │                         │
           └─────────┬───────────────┘
                     ▼
               ┌──────────┐
               │Prometheus│
               └──────────┘
```

### Component Responsibilities

| Component          | Purpose                    | Port      | Protocol  | Retention |
| ------------------ | -------------------------- | --------- | --------- | --------- |
| **Prometheus**     | Metrics scraping & storage | 19090     | HTTP Pull | 15 days   |
| **Grafana**        | Visualization & dashboards | 3000      | HTTP      | N/A       |
| **Loki**           | Log aggregation            | 3100      | HTTP Push | 7 days    |
| **Promtail**       | Log shipper                | 9080      | N/A       | N/A       |
| **Tempo**          | Trace storage              | 3200      | HTTP/OTLP | 48 hours  |
| **OTEL Collector** | Trace ingestion            | 4317/4318 | gRPC/HTTP | N/A       |
| **Node Exporter**  | Host metrics               | 9100      | HTTP      | N/A       |
| **cAdvisor**       | Container metrics          | 8080      | HTTP      | N/A       |

---

## Progressive Enhancement

### Design Rationale

**Decision**: Incremental deployment instead of "all-or-nothing"

**Rationale**:

- Development: Start with minimal overhead (L0)
- Staging: Add metrics (L1) for performance testing
- Pre-production: Add logs/traces (L2) for troubleshooting
- Production: Full stack (L3) with infrastructure monitoring

**Memory Budget**:

- L0 (Gateway only): ~200MB
- L1 (+Prometheus+Grafana): ~712MB (+512MB)
- L2 (+Loki+Tempo+OTEL): ~1.7GB (+1GB)
- L3 (+NodeExporter+cAdvisor): ~2.2GB (+500MB)

### Level Definitions

#### L0: Gateway Standalone

```yaml
# watt.json (minimal)
{ 'server': { 'hostname': '0.0.0.0', 'port': 3042 }, 'logger': { 'level': 'info' } }
```

**Capabilities**:

- ✅ Fastify server logs (stdout)
- ✅ Basic health check endpoint
- ❌ No metrics aggregation
- ❌ No log retention

**Use Case**: Local development, unit tests

---

#### L1: Metrics Layer

```yaml
# watt.json (metrics enabled)
{
  'server': { 'hostname': '0.0.0.0', 'port': 3042 },
  'logger': { 'level': 'info' },
  'metrics': { 'hostname': '0.0.0.0', 'port': 9090 },
}
```

**Architecture**:

```
Gateway (/metrics:9090)
    │
    ▼
Prometheus (scrape 15s)
    │
    ▼
Grafana (Admin Hub Dashboard)
    ├─ Request Rate (req/s)
    ├─ Latency P50/P95/P99 (ms)
    ├─ Error Rate (%)
    └─ Uptime (%)
```

**New Capabilities**:

- ✅ HTTP request metrics (histogram)
- ✅ Grafana dashboard "Admin Hub"
- ✅ Prometheus alerting (future)

**Resource Impact**: +512MB RAM

---

#### L2: Full Observability

```yaml
# docker-compose.observability.yml
services:
  loki:
    image: grafana/loki:2.9.3
    ports:
      - '3100:3100'
    volumes:
      - ./infrastructure/loki/loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki

  promtail:
    image: grafana/promtail:2.9.3
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./infrastructure/promtail/promtail-config.yml:/etc/promtail/config.yml

  tempo:
    image: grafana/tempo:2.3.1
    ports:
      - '3200:3200'
      - '4317:4317' # OTLP gRPC
    volumes:
      - ./infrastructure/tempo/tempo.yml:/etc/tempo.yaml
      - tempo-data:/tmp/tempo

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.91.0
    ports:
      - '4318:4318' # OTLP HTTP
    volumes:
      - ./infrastructure/otel/otel-collector-config.yml:/etc/otel-collector-config.yaml
```

**Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW (L2)                            │
└─────────────────────────────────────────────────────────────────┘

METRICS PATH:
    Gateway → Prometheus → Grafana

LOGS PATH:
    Gateway (stdout JSON) → Docker logs → Promtail → Loki → Grafana

TRACES PATH:
    Gateway → OTEL SDK → OTEL Collector → Tempo → Grafana

CORRELATION:
    requestId (UUID) + traceId (W3C) → Link all 3 signals
```

**New Capabilities**:

- ✅ Centralized log storage (7 days)
- ✅ LogQL queries (search by correlation ID, user, status)
- ✅ Distributed tracing (request flow visualization)
- ✅ Log-to-trace navigation (click log → jump to trace)

**Resource Impact**: +1GB RAM

---

#### L3: Infrastructure Monitoring

```yaml
# docker-compose.observability.yml (extended)
services:
  node-exporter:
    image: prom/node-exporter:v1.7.0
    ports:
      - '9100:9100'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    ports:
      - '8080:8080'
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
```

**New Capabilities**:

- ✅ Host CPU/RAM/Disk monitoring
- ✅ Container resource usage per service
- ✅ Infrastructure dashboard
- ✅ Capacity planning metrics

**Resource Impact**: +500MB RAM

---

## Metrics Design

### Platformatic Built-in Metrics

**Configuration** (`watt.json`):

```json
{
  "metrics": {
    "hostname": "0.0.0.0",
    "port": 9090
  }
}
```

**Pseudo-code: Metrics Exposure**

```javascript
FUNCTION enableMetrics(config):
  // 1. Platformatic auto-instruments Fastify with prom-client
  promClient = require('prom-client')

  // 2. Register default Node.js metrics
  promClient.collectDefaultMetrics({
    prefix: 'nodejs_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
  })

  // 3. Create HTTP histogram
  httpDuration = NEW Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in milliseconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  })

  // 4. Instrument Fastify hooks
  fastify.addHook('onRequest', (request, reply, done) => {
    request.startTime = process.hrtime.bigint()
    done()
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    duration = (process.hrtime.bigint() - request.startTime) / 1_000_000n  // Convert to ms

    httpDuration.observe({
      method: request.method,
      route: request.routeOptions.url || 'unknown',
      status: reply.statusCode
    }, Number(duration))

    done()
  })

  // 5. Expose /metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', promClient.register.contentType)
    RETURN promClient.register.metrics()
  })

  // 6. Start metrics server (separate port)
  fastify.listen({ port: config.metrics.port, host: config.metrics.hostname })
END FUNCTION
```

### Default Metrics Exposed

**Node.js Runtime**:

```promql
# Heap memory
nodejs_heap_size_total_bytes
nodejs_heap_size_used_bytes

# Garbage Collection
nodejs_gc_duration_seconds_bucket

# Event Loop Lag
nodejs_eventloop_lag_seconds
```

**HTTP Requests**:

```promql
# Request histogram (calcola P50/P95/P99)
http_request_duration_ms_bucket{method="GET",route="/api/patients",status="200"}
http_request_duration_ms_sum
http_request_duration_ms_count

# Derived metrics
rate(http_request_duration_ms_count[5m])  # Request rate (req/s)
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))  # P95 latency
```

### Prometheus Scraping Configuration

```yaml
# infrastructure/prometheus/prometheus.yml
global:
  scrape_interval: 15s # Default: 15s (production balance)
  evaluation_interval: 15s # Rule evaluation frequency

scrape_configs:
  - job_name: 'api-gateway'
    scrape_interval: 10s # Gateway-specific: faster scraping
    metrics_path: '/metrics'
    static_configs:
      - targets: ['gateway:3042'] # Or gateway:9090 if separate port
        labels:
          service: 'gateway'
          component: 'platformatic-watt'
          environment: 'development'
```

**Pseudo-code: Prometheus Scraping Loop**

```javascript
FUNCTION prometheusScrapingLoop():
  WHILE true:
    SLEEP(scrape_interval)  // 15s

    FOR EACH target IN scrape_configs:
      endpoint = "{target.host}:{target.port}{target.metrics_path}"

      TRY:
        // HTTP GET request
        response = HTTP_GET(endpoint, timeout=10s)

        IF response.status == 200:
          // Parse Prometheus exposition format
          metrics = PARSE_PROMETHEUS_METRICS(response.body)

          // Store in TSDB
          FOR EACH metric IN metrics:
            timestamp = NOW()
            WRITE_TSDB(metric.name, metric.value, metric.labels, timestamp)

          // Update target health
          UPDATE_TARGET_STATUS(target, "up")
        ELSE:
          UPDATE_TARGET_STATUS(target, "down")

      CATCH error:
        LOG_ERROR("Scrape failed for {target}: {error}")
        UPDATE_TARGET_STATUS(target, "down")
END FUNCTION
```

---

## Logging Design

### Structured Logging Strategy

**Decision**: JSON-structured logs with correlation IDs

**Rationale**:

- Human-readable in development (pino-pretty)
- Machine-parseable in production (Loki ingestion)
- Correlation with metrics and traces via requestId

### Log Format Schema

```typescript
interface StructuredLog {
  // Standard Pino fields
  level: number; // 10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal
  time: number; // Unix timestamp (ms)
  pid: number; // Process ID
  hostname: string; // Container/host name

  // Correlation fields
  requestId: string; // UUID v4 (X-Request-ID header)
  traceId?: string; // W3C Trace Context (from OTEL)
  spanId?: string; // Current span ID

  // Request context
  method?: string; // HTTP method (GET, POST, etc.)
  url?: string; // Request URL
  statusCode?: number; // HTTP status code
  duration?: number; // Response time (ms)

  // User context
  userId?: string; // Authenticated user ID (JWT sub)
  userEmail?: string; // User email (PII - careful!)

  // Error context
  err?: {
    type: string; // Error class name
    message: string; // Error message
    stack?: string; // Stack trace (dev only)
  };

  // Custom fields
  [key: string]: any; // Business-specific fields

  // Message (always last)
  msg: string; // Human-readable description
}
```

### Pseudo-code: Log Generation

```javascript
FUNCTION logHttpRequest(request, reply, context):
  // 1. Extract correlation IDs
  requestId = request.headers['x-request-id'] || generateUUID()
  traceId = OTEL_SDK.getActiveSpan()?.spanContext().traceId
  spanId = OTEL_SDK.getActiveSpan()?.spanContext().spanId

  // 2. Calculate duration
  duration = context.getElapsedTime()

  // 3. Extract user context (if authenticated)
  userId = request.user?.sub
  userEmail = request.user?.email

  // 4. Build structured log
  logData = {
    requestId: requestId,
    traceId: traceId,
    spanId: spanId,
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: duration,
    userId: userId,
    userEmail: userEmail  // ⚠️ PII - mask in production
  }

  // 5. Choose log level based on status
  IF reply.statusCode >= 500:
    request.log.error(logData, "HTTP request failed (5xx)")
  ELSE IF reply.statusCode >= 400:
    request.log.warn(logData, "HTTP request client error (4xx)")
  ELSE:
    request.log.info(logData, "HTTP request completed")
END FUNCTION
```

### Loki Aggregation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOKI PIPELINE                                │
└─────────────────────────────────────────────────────────────────┘

1. LOG GENERATION
   Gateway → Pino logger → stdout (JSON lines)

2. LOG CAPTURE
   Docker → /var/lib/docker/containers/[id]/[id]-json.log

3. LOG SHIPPING
   Promtail → Scrape Docker logs → Parse JSON → Extract labels

4. LOG STORAGE
   Loki → Index labels → Store chunks (gzip compressed)

5. LOG QUERYING
   Grafana → LogQL → Loki API → Stream results
```

**Pseudo-code: Promtail JSON Pipeline**

```javascript
FUNCTION promtailPipeline(logLine):
  // 1. Parse JSON log
  parsed = JSON.parse(logLine)

  // 2. Extract labels (indexed fields)
  labels = {
    job: "gateway",
    level: mapLevel(parsed.level),           // "info", "warn", "error"
    method: parsed.method,                    // "GET", "POST"
    status: mapStatusRange(parsed.statusCode), // "2xx", "4xx", "5xx"
    requestId: parsed.requestId
  }

  // 3. Keep all fields in log content (searchable, not indexed)
  content = logLine  // Original JSON line

  // 4. Send to Loki
  SEND_TO_LOKI({
    streams: [{
      stream: labels,
      values: [[timestamp, content]]
    }]
  })
END FUNCTION

FUNCTION mapLevel(pinoLevel):
  IF pinoLevel >= 50: RETURN "error"
  IF pinoLevel >= 40: RETURN "warn"
  IF pinoLevel >= 30: RETURN "info"
  RETURN "debug"
END FUNCTION

FUNCTION mapStatusRange(statusCode):
  IF statusCode >= 500: RETURN "5xx"
  IF statusCode >= 400: RETURN "4xx"
  IF statusCode >= 300: RETURN "3xx"
  IF statusCode >= 200: RETURN "2xx"
  RETURN "1xx"
END FUNCTION
```

### Loki Configuration

```yaml
# infrastructure/loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m # Flush chunks after 5m idle
  chunk_retain_period: 30s # Keep flushed chunks 30s for queries

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper # Index storage
      object_store: filesystem # Chunk storage
      schema: v11
      index:
        prefix: index_
        period: 24h # Daily index rotation

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h # 7 days retention

table_manager:
  retention_deletes_enabled: true
  retention_period: 168h # 7 days auto-deletion
```

**Decision Rationale**:

- **BoltDB Shipper**: Simple single-node storage (development/staging)
- **Filesystem**: Local storage (no S3 needed for now)
- **7-day retention**: Balance storage cost vs troubleshooting needs
- **Daily index rotation**: Query optimization for recent logs

---

## Tracing Design

### Distributed Tracing Strategy

**Decision**: OpenTelemetry SDK + Tempo backend

**Rationale**:

- OTEL: Vendor-neutral standard (future-proof)
- Tempo: Lightweight, integrates with Grafana
- W3C Trace Context: Standard propagation format

### Trace Context Propagation

```
┌─────────────────────────────────────────────────────────────────┐
│              W3C TRACE CONTEXT PROPAGATION                       │
└─────────────────────────────────────────────────────────────────┘

Client Request
    │
    ├─ Header: traceparent: 00-{traceId}-{spanId}-01
    │
    ▼
Gateway (Root Span)
    │
    ├─ Extract traceId + parentSpanId from header
    ├─ Create new spanId for gateway
    ├─ Propagate to downstream services
    │
    ▼
Auth Service (Child Span)
    │
    ├─ Extract traceId + parentSpanId
    ├─ Create new spanId for auth
    │
    ▼
Database (Child Span)
    └─ Extract traceId + parentSpanId
       Create new spanId for DB query

All spans share same traceId → Grafana reconstructs call tree
```

**W3C Traceparent Format**:

```
traceparent: 00-{traceId}-{spanId}-{flags}
             │   │         │        │
             │   │         │        └─ Sampling decision (01=sampled)
             │   │         └─────────── Current span ID (16 hex chars)
             │   └───────────────────── Trace ID (32 hex chars, globally unique)
             └───────────────────────── Version (always "00")

Example:
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

### Pseudo-code: OTEL Instrumentation

```javascript
FUNCTION initializeTracing(config):
  // 1. Import OTEL SDK
  { NodeSDK } = require('@opentelemetry/sdk-node')
  { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
  { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')

  // 2. Configure exporter
  exporter = NEW OTLPTraceExporter({
    url: config.OTEL_EXPORTER_URL || 'http://otel-collector:4318/v1/traces'
  })

  // 3. Configure SDK
  sdk = NEW NodeSDK({
    serviceName: 'tech-citizen-gateway',
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fastify': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-redis': { enabled: true }
      })
    ]
  })

  // 4. Start SDK (auto-instrument Fastify)
  sdk.start()

  RETURN sdk
END FUNCTION

FUNCTION createCustomSpan(name, attributes):
  // 1. Get tracer
  tracer = OTEL_API.getTracer('tech-citizen-gateway')

  // 2. Create span
  span = tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: attributes
  })

  // 3. Set context (propagation)
  context = OTEL_API.setSpan(OTEL_API.context.active(), span)

  TRY:
    // Execute instrumented code
    RETURN OTEL_API.context.with(context, () => {
      result = yourBusinessLogic()
      span.setStatus({ code: SpanStatusCode.OK })
      RETURN result
    })
  CATCH error:
    // Record error
    span.recordException(error)
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
    THROW error
  FINALLY:
    // Always end span
    span.end()
END FUNCTION
```

### Tempo Configuration

```yaml
# infrastructure/tempo/tempo.yml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: '0.0.0.0:4317'
        http:
          endpoint: '0.0.0.0:4318'

storage:
  trace:
    backend: local # Local filesystem (dev/staging)
    wal:
      path: /tmp/tempo/wal # Write-ahead log
    local:
      path: /tmp/tempo/blocks # Block storage

compactor:
  compaction:
    block_retention: 48h # 48-hour retention

metrics_generator:
  storage:
    path: /tmp/tempo/generator
```

**Decision Rationale**:

- **Local storage**: Simple setup (no S3 needed)
- **48h retention**: Short-term troubleshooting (traces are large)
- **OTLP receivers**: Both gRPC (4317) and HTTP (4318) for flexibility

---

## Correlation Strategy

### Three-Signal Correlation

```
┌─────────────────────────────────────────────────────────────────┐
│                  CORRELATION ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

Single HTTP Request generates:

1. METRICS (Prometheus)
   ├─ http_request_duration_ms{method="GET",route="/api/patients",status="200"}
   └─ Labels: method, route, status (NO requestId - cardinality explosion)

2. LOGS (Loki)
   ├─ {job="gateway",level="info",requestId="550e8400..."}
   └─ Content: {"requestId":"550e8400...","traceId":"4bf92f35...","statusCode":200,...}

3. TRACES (Tempo)
   ├─ traceId: 4bf92f3577b34da6a3ce929d0e0e4736
   ├─ Spans: gateway → auth → database
   └─ Each span has spanId, links to logs via traceId

CORRELATION KEYS:
  - requestId (UUID v4) → Link log entries within same request
  - traceId (W3C) → Link traces to logs
  - timestamp → Align metrics time-series with log/trace events
```

### Correlation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│            USER TROUBLESHOOTING WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

SCENARIO: "Why is /api/patients slow?"

Step 1: METRICS (Grafana Dashboard)
   └─ Query: histogram_quantile(0.95, rate(http_request_duration_ms_bucket{route="/api/patients"}[5m]))
   └─ Result: P95 = 850ms (❌ above 300ms target)

Step 2: LOGS (Grafana Explore → Loki)
   └─ Query: {job="gateway"} |= "/api/patients" | json | duration > 500
   └─ Result: 23 slow requests in last hour
   └─ Click log line → Extract requestId="550e8400-e29b-41d4-a716-446655440000"

Step 3: TRACES (Grafana Explore → Tempo)
   └─ Log contains: traceId="4bf92f3577b34da6a3ce929d0e0e4736"
   └─ Click "View Trace" button → Grafana opens Tempo
   └─ Result: Trace waterfall shows:
       ├─ Gateway: 20ms
       ├─ Auth Service: 15ms
       └─ Database Query: 800ms ← BOTTLENECK FOUND

Step 4: ROOT CAUSE
   └─ Database query missing index on patients.created_at
   └─ Fix: Add index, P95 drops to 120ms ✅
```

### Pseudo-code: Correlation Implementation

```javascript
FUNCTION instrumentRequest(fastifyInstance):
  // 1. Generate correlation IDs on request
  fastifyInstance.addHook('onRequest', async (request, reply) => {
    // Extract or generate requestId
    requestId = request.headers['x-request-id'] || generateUUID()
    request.headers['x-request-id'] = requestId

    // OTEL creates traceId automatically
    traceId = OTEL_SDK.getActiveSpan()?.spanContext().traceId
    spanId = OTEL_SDK.getActiveSpan()?.spanContext().spanId

    // Attach to request context
    request.correlationContext = {
      requestId: requestId,
      traceId: traceId,
      spanId: spanId,
      startTime: process.hrtime.bigint()
    }

    // Create child logger with correlation
    request.log = request.log.child({
      requestId: requestId,
      traceId: traceId,
      spanId: spanId
    })
  })

  // 2. Log request completion with all correlation IDs
  fastifyInstance.addHook('onResponse', async (request, reply) => {
    ctx = request.correlationContext
    duration = (process.hrtime.bigint() - ctx.startTime) / 1_000_000n  // Convert to ms

    // This log will have requestId, traceId, spanId attached
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: Number(duration),
      userId: request.user?.sub
    }, 'HTTP request completed')

    // Metrics recorded separately (no requestId to avoid cardinality)
    METRICS.httpDuration.observe({
      method: request.method,
      route: request.routeOptions.url,
      status: reply.statusCode
    }, Number(duration))
  })
END FUNCTION
```

---

## Data Flow Diagrams

### Complete Data Flow (L2)

```
┌─────────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY DATA FLOW                        │
└─────────────────────────────────────────────────────────────────┘

HTTP REQUEST arrives at Gateway
    │
    ├──────────────────────────────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌─────────────┐                                   ┌─────────────┐
│  GENERATE   │                                   │  GENERATE   │
│ requestId   │                                   │  traceId    │
│   (UUID)    │                                   │ (W3C OTEL)  │
└─────────────┘                                   └─────────────┘
    │                                                   │
    └───────────────────┬───────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   PROCESS REQUEST     │
            │  (Fastify handlers)   │
            └───────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  ┌─────────┐    ┌──────────┐    ┌──────────┐
  │ METRICS │    │   LOGS   │    │  TRACES  │
  └─────────┘    └──────────┘    └──────────┘
        │               │               │
        ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│ Prometheus │  │ Loki       │  │ Tempo      │
│ (scrape)   │  │ (push)     │  │ (push)     │
└────────────┘  └────────────┘  └────────────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │     GRAFANA      │
              │   (Datasources)  │
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   DASHBOARDS     │
              ├──────────────────┤
              │ - Admin Hub      │
              │ - Infrastructure │
              │ - Logs & Traces  │
              └──────────────────┘
```

### Metrics Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                     METRICS FLOW (PULL MODEL)                    │
└─────────────────────────────────────────────────────────────────┘

T=0s: Request arrives
      Gateway increments counter, starts histogram timer

T=0.045s: Response sent (45ms duration)
      Gateway records histogram observation:
      http_request_duration_ms_bucket{le="50",method="GET",route="/api/patients",status="200"} +1
      http_request_duration_ms_sum{method="GET",route="/api/patients",status="200"} +45
      http_request_duration_ms_count{method="GET",route="/api/patients",status="200"} +1

T=10s: Prometheus scrape interval (every 10s for gateway)
      1. Prometheus HTTP GET http://gateway:3042/metrics
      2. Gateway returns current metrics snapshot (text format)
      3. Prometheus parses metrics, stores in TSDB:
         - metric: http_request_duration_ms_bucket
         - labels: {le="50", method="GET", route="/api/patients", status="200"}
         - value: 1
         - timestamp: 1702342130000

T=15s: Next Prometheus scrape
      Counter now shows: http_request_duration_ms_count = 3 (3 requests in 15s)
      Prometheus stores: {value: 3, timestamp: 1702342135000}

QUERY TIME: User opens Grafana dashboard
      PromQL: rate(http_request_duration_ms_count[5m])
      Calculation:
        - Fetch all samples in last 5 minutes
        - Calculate per-second rate: (count_now - count_5m_ago) / 300s
        - Result: 0.6 req/s (3 requests / 5 seconds = 0.6 req/s average)
```

### Logs Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOGS FLOW (PUSH MODEL)                       │
└─────────────────────────────────────────────────────────────────┘

T=0s: Request arrives
      Fastify logger writes to stdout:
      {"level":30,"time":1702342130000,"requestId":"550e8400...","method":"GET",...}

T=0s: Docker captures stdout
      Writes to: /var/lib/docker/containers/[container-id]/[container-id]-json.log
      Format: {"log":"<json-log-line>","stream":"stdout","time":"2023-12-12T10:15:30.123Z"}

T=0-5s: Promtail scrapes Docker logs (every 1-5s)
      1. Read new lines from /var/lib/docker/containers/...
      2. Parse outer JSON (Docker wrapper)
      3. Parse inner JSON (actual Pino log)
      4. Extract labels for indexing:
         - job: "gateway"
         - level: "info" (from Pino level 30)
         - requestId: "550e8400..."
      5. Keep full JSON as log content (searchable, not indexed)

T=0-5s: Promtail pushes batch to Loki
      HTTP POST http://loki:3100/loki/api/v1/push
      Body: {
        "streams": [{
          "stream": {"job":"gateway","level":"info","requestId":"550e8400..."},
          "values": [["1702342130000000000", "<full-json-log>"]]
        }]
      }

T=0-5s: Loki ingests logs
      1. Index labels (BoltDB): job=gateway, level=info, requestId=550e8400
      2. Compress log content (gzip)
      3. Write chunk to filesystem: /loki/chunks/[chunk-id]
      4. Flush chunk after 5m idle or 1MB size

QUERY TIME: User searches in Grafana
      LogQL: {job="gateway",requestId="550e8400..."} | json | duration > 100
      Execution:
        1. Loki queries index: Find chunks with job=gateway AND requestId=550e8400
        2. Read matching chunks from filesystem
        3. Decompress and parse JSON content
        4. Filter: duration > 100
        5. Return matching log lines to Grafana
```

### Traces Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRACES FLOW (PUSH MODEL)                      │
└─────────────────────────────────────────────────────────────────┘

T=0s: Request arrives with traceparent header
      traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
                      │  │                                │
                      │  └─ traceId (shared)              └─ parentSpanId
                      └─ version

T=0s: OTEL SDK extracts context
      traceId = "4bf92f3577b34da6a3ce929d0e0e4736"
      parentSpanId = "00f067aa0ba902b7"

      Creates new span:
      spanId = generateRandomId()  // "a1b2c3d4e5f6g7h8"
      span = {
        traceId: "4bf92f3577b34da6a3ce929d0e0e4736",
        spanId: "a1b2c3d4e5f6g7h8",
        parentSpanId: "00f067aa0ba902b7",
        name: "GET /api/patients",
        kind: "SERVER",
        startTime: 1702342130000000000,
        attributes: {
          "http.method": "GET",
          "http.route": "/api/patients",
          "http.status_code": 200
        }
      }

T=0.045s: Request completes
      span.endTime = 1702342130045000000
      span.attributes["http.status_code"] = 200

T=0.045-1s: OTEL SDK batches span
      Buffer: [span1, span2, span3, ...]
      Batch size: 512 spans OR 1 second timeout

T=1s: OTEL SDK exports batch
      HTTP POST http://otel-collector:4318/v1/traces
      Body: OTLP JSON format with batch of spans

T=1s: OTEL Collector receives batch
      1. Validates OTLP format
      2. Applies processors (sampling, filtering, enrichment)
      3. Exports to Tempo backend

T=1s: Tempo ingests spans
      1. Write to WAL (write-ahead log) for durability
      2. Buffer spans by traceId
      3. Write complete traces to blocks: /tmp/tempo/blocks/[traceId]
      4. Build bloom filter index for fast trace lookup

QUERY TIME: User searches for trace
      Query: traceId = "4bf92f3577b34da6a3ce929d0e0e4736"
      Execution:
        1. Tempo queries bloom filter: Find block containing traceId
        2. Read block from filesystem
        3. Extract all spans for traceId
        4. Build span tree (parent-child relationships)
        5. Return to Grafana for waterfall visualization
```

---

## Configuration Decisions

### 1. Scrape Intervals

| Metric Source   | Interval | Rationale                                          |
| --------------- | -------- | -------------------------------------------------- |
| Gateway         | 10s      | Fast feedback for HTTP requests (high-cardinality) |
| Prometheus self | 15s      | Standard interval, low cardinality                 |
| Node Exporter   | 30s      | Infrastructure metrics change slowly               |
| cAdvisor        | 30s      | Container metrics change slowly                    |

**Decision**: Different intervals based on volatility

**Pseudo-code: Dynamic Scrape Interval**

```javascript
FUNCTION calculateScrapeInterval(target):
  IF target.type == "application":
    IF target.cardinality > 10000:
      RETURN 5s   // High-cardinality: scrape often to reduce data loss
    ELSE:
      RETURN 10s  // Standard application scraping
  ELSE IF target.type == "infrastructure":
    RETURN 30s    // Infrastructure changes slowly
  ELSE:
    RETURN 15s    // Default
END FUNCTION
```

### 2. Retention Policies

| Data Type | Retention | Storage         | Rationale                                   |
| --------- | --------- | --------------- | ------------------------------------------- |
| Metrics   | 15 days   | Prometheus TSDB | Balance query speed vs disk space           |
| Logs      | 7 days    | Loki chunks     | Sufficient for troubleshooting              |
| Traces    | 48 hours  | Tempo blocks    | Traces are large, recent data most valuable |

**Decision**: Short retention for development, extend in production

**Pseudo-code: Retention Enforcement**

```javascript
FUNCTION enforceRetention():
  EVERY 24 hours:
    // Prometheus
    FOR EACH block IN prometheus_blocks:
      IF block.timestamp < (NOW - 15_days):
        DELETE block

    // Loki
    FOR EACH chunk IN loki_chunks:
      IF chunk.timestamp < (NOW - 7_days):
        DELETE chunk

    // Tempo
    FOR EACH trace_block IN tempo_blocks:
      IF trace_block.timestamp < (NOW - 48_hours):
        DELETE trace_block
END FUNCTION
```

### 3. Label Cardinality Control

**Decision**: Limit labels to low-cardinality fields

**High-cardinality fields** (❌ DO NOT use as labels):

- `requestId` (UUID, infinite cardinality)
- `userId` (thousands of users)
- `traceId` (UUID, infinite cardinality)
- `timestamp` (continuous values)

**Low-cardinality fields** (✅ SAFE as labels):

- `method` (10 values: GET, POST, PUT, DELETE, etc.)
- `status` (10 values: 200, 201, 400, 404, 500, etc.)
- `route` (50 values: /api/patients, /api/users, etc.)
- `environment` (3 values: development, staging, production)

**Pseudo-code: Cardinality Check**

```javascript
FUNCTION validateLabel(name, value):
  // 1. Check if label is in deny list
  IF name IN ["requestId", "userId", "traceId", "timestamp"]:
    THROW Error("High-cardinality label not allowed: {name}")

  // 2. Check cardinality of existing values
  existingValues = METRICS_REGISTRY.getLabelValues(name)

  IF existingValues.size > 1000:
    THROW Error("Label {name} exceeded cardinality limit (1000)")

  RETURN true
END FUNCTION
```

---

## Query Examples

### PromQL (Prometheus Query Language)

#### Request Rate (req/s)

```promql
# 5-minute average request rate
rate(http_request_duration_ms_count{job="api-gateway"}[5m])

# Per-route request rate
sum by (route) (rate(http_request_duration_ms_count[5m]))

# Success rate (2xx status codes only)
rate(http_request_duration_ms_count{status=~"2.."}[5m])
```

#### Latency (P50, P95, P99)

```promql
# P50 latency (median)
histogram_quantile(0.50,
  rate(http_request_duration_ms_bucket{job="api-gateway"}[5m])
)

# P95 latency (95th percentile)
histogram_quantile(0.95,
  rate(http_request_duration_ms_bucket{job="api-gateway"}[5m])
)

# P99 latency (99th percentile, worst 1%)
histogram_quantile(0.99,
  rate(http_request_duration_ms_bucket{job="api-gateway"}[5m])
)
```

#### Error Rate (%)

```promql
# Error rate (5xx) as percentage
100 * (
  rate(http_request_duration_ms_count{status=~"5.."}[5m])
  /
  rate(http_request_duration_ms_count[5m])
)

# Client error rate (4xx) as percentage
100 * (
  rate(http_request_duration_ms_count{status=~"4.."}[5m])
  /
  rate(http_request_duration_ms_count[5m])
)
```

### LogQL (Loki Query Language)

#### Basic Log Queries

```logql
# All gateway logs
{job="gateway"}

# Error logs only
{job="gateway",level="error"}

# Logs for specific request
{job="gateway"} |= "550e8400-e29b-41d4-a716-446655440000"

# Logs for specific user
{job="gateway"} | json | userId="user-123"
```

#### Advanced Filters

```logql
# Slow requests (> 500ms)
{job="gateway"} | json | duration > 500

# Failed requests (5xx status codes)
{job="gateway"} | json | statusCode >= 500

# POST requests to /api/patients
{job="gateway",method="POST"} |= "/api/patients"

# Errors with stack traces
{job="gateway",level="error"} | json | err_stack != ""
```

#### Aggregations

```logql
# Request count per minute
sum(count_over_time({job="gateway"}[1m]))

# Average duration per route
avg by (route) (avg_over_time({job="gateway"} | json | unwrap duration [5m]))

# P95 duration
quantile_over_time(0.95, {job="gateway"} | json | unwrap duration [5m])
```

### TraceQL (Tempo Query Language)

#### Find Traces

```traceql
# All traces for gateway service
{ service.name = "tech-citizen-gateway" }

# Slow traces (> 1 second)
{ duration > 1s }

# Traces with errors
{ status = error }

# Traces for specific user
{ user.id = "user-123" }

# Complex query: Slow POST requests with errors
{
  service.name = "tech-citizen-gateway" &&
  http.method = "POST" &&
  duration > 500ms &&
  status = error
}
```

---

## Appendix: Decision Records

### ADR-004: Structured Logging with Loki Readiness

**Status**: Accepted  
**Context**: Need centralized logging for troubleshooting  
**Decision**: Phase 1 (Pino JSON logs), Phase 2 (Loki stack)  
**Consequences**: ✅ Logs queryable, ✅ Correlation-ready, ✅ Incremental adoption

### US-000: Refactoring Observability - Framework-First

**Status**: Planning Complete  
**Context**: Custom metrics code duplicates Platformatic built-in  
**Decision**: Remove 800 LOC custom code, use Platformatic `metrics` config  
**Consequences**: ✅ Less code to maintain, ✅ Standard metrics, ❌ Less flexibility

### EPIC-002: Observability Stack (Gateway Admin Hub)

**Status**: In Progress (0/8 user stories)  
**Context**: Need production-ready observability  
**Decision**: Progressive enhancement (L0→L1→L2→L3)  
**Consequences**: ✅ Incremental deployment, ✅ Resource control, ✅ Testable milestones

---

**Last Updated**: 2025-12-13  
**Status**: ✅ Design Complete (awaiting v2 implementation)  
**Maintainer**: Antonio Cittadino
