# EPIC-003: Observability & Admin Foundation

## 🎯 Epic Goal

Implement complete observability stack (health checks, structured logging, metrics, alerting) and
admin dashboard MVP to monitor system health and troubleshoot issues in real-time.

## 📊 Business Value

- **Reduced MTTR**: Correlation IDs and centralized logs enable fast incident resolution
- **Proactive Monitoring**: Alerts on error rate spikes before users notice
- **Operational Visibility**: Admin dashboard shows system health at a glance
- **Production Readiness**: Health checks enable zero-downtime deployments

## 🏗️ Architecture Target

```
┌────────────────────────────────────────────────────────────────┐
│                      GATEWAY (Entry Point)                     │
│  /api/* → services  /admin/* → admin UI  /metrics → prometheus│
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ thc-db   │  │thc-svc   │  │ admin-ui │  │telemetry │      │
│  │ /health  │  │ /health  │  │ (React)  │  │(metrics) │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┘             │
│              Pino Unified Logging                             │
│              Correlation ID Chain                             │
│              Error Handler Middleware                         │
└────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                 OBSERVABILITY STACK                            │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐          │
│  │ Prometheus │───▶│  Grafana   │───▶│  Alerts    │          │
│  │  (scrape)  │    │ (dashboard)│    │  (webhook) │          │
│  └────────────┘    └────────────┘    └────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

## 📅 Sprint 3 Planning

**Duration**: 1 week (5 days)  
**Team**: 1 developer  
**Total Effort**: ~21 Story Points (~26 hours)

### Velocity Assumptions

- **Developer productivity**: 5-6 hours/day of focused coding
- **Buffer**: 20% for unexpected issues (meetings, context switches)
- **Target**: Complete all 3 stories in 5 days

### Daily Breakdown

| Day | Focus                        | Tasks                   | Hours |
| --- | ---------------------------- | ----------------------- | ----- |
| Mon | Health & Logging             | 3.1.1, 3.1.2            | 7h    |
| Tue | Correlation ID + Error       | 3.1.3, 3.1.4            | 5h    |
| Wed | Telemetry Stack              | 3.2.1, 3.2.2            | 7h    |
| Thu | Grafana Dashboard + Alerting | 3.2.3, 3.2.4            | 5h    |
| Fri | Admin UI + Integration       | 3.3.1, 3.3.2, 3.3.3     | 7h    |
|     | **Total**                    | **10 tasks**            | 31h   |

_(includes 20% buffer, actual implementation ~26h)_

---

## 📋 Story 3.1: Health Checks & Logging Centralizzato

**Story Points**: 8  
**Estimated Hours**: 12h  
**Priority**: P0 (Must Have)

### Business Context

Health checks are critical for:

- **Kubernetes/Docker**: Liveness and readiness probes prevent cascading failures
- **Load Balancers**: Remove unhealthy instances from rotation
- **Monitoring**: Track service availability over time

### Acceptance Criteria (BDD)

#### Task 3.1.1: Implement health endpoints [4h]

```gherkin
Feature: Health Check Endpoints
  As a DevOps engineer
  I want standardized health endpoints
  So that I can monitor service health and enable zero-downtime deployments

  Background:
    Given Platformatic services are running
    And database is available

  Scenario: Liveness check (service is alive)
    When I GET "/health/live"
    Then response status should be 200
    And response body should be:
      """
      {
        "status": "ok",
        "timestamp": "<ISO8601>",
        "service": "thc-db"
      }
      """
    And response time should be < 100ms
    And no external dependencies should be checked

  Scenario: Readiness check (service ready to serve traffic)
    When I GET "/health/ready"
    Then response status should be 200
    And response body should include:
      """
      {
        "status": "ready",
        "timestamp": "<ISO8601>",
        "service": "thc-db",
        "checks": {
          "database": "ok",
          "migrations": "ok"
        }
      }
      """

  Scenario: Readiness check fails when DB down
    Given database connection is broken
    When I GET "/health/ready"
    Then response status should be 503
    And response body should be:
      """
      {
        "status": "not_ready",
        "checks": {
          "database": "error: connection refused"
        }
      }
      """

  Scenario: Health checks for all services
    Given all Watt services are running
    Then each service should expose "/health/live"
    And each service should expose "/health/ready"
    And thc-db health should check database
    And thc-gateway health should check downstream services
```

**Implementation Notes**:

- Use Fastify `onReady` hook for initialization checks
- Liveness = process is running (no dependencies)
- Readiness = dependencies OK (DB, cache, etc.)
- Return 200 for healthy, 503 for unhealthy
- Log health check failures with ERROR level

#### Task 3.1.2: Unified Pino logger configuration [3h]

```gherkin
Feature: Unified Logging with Pino
  As a developer
  I want structured JSON logs
  So that I can query logs efficiently and troubleshoot issues

  Scenario: Development mode logs (pretty print)
    Given PLT_LOG_LEVEL is "debug"
    And NODE_ENV is "development"
    When I run "npm run dev"
    Then logs should be formatted with pino-pretty
    And logs should include timestamp, level, message
    And logs should be human-readable

  Scenario: Production mode logs (JSON)
    Given PLT_LOG_LEVEL is "info"
    And NODE_ENV is "production"
    When I run "npm start"
    Then logs should be structured JSON
    And each log entry should include:
      | field     | example               |
      | level     | 30                    |
      | time      | 1702569600000         |
      | msg       | "Request processed"   |
      | service   | "thc-db"              |
      | requestId | "req-123"             |

  Scenario: Log levels work correctly
    Given logger is configured
    When I log at level "debug"
    Then log should only appear if PLT_LOG_LEVEL <= "debug"
    When I log at level "error"
    Then log should appear at all log levels
    And log should include stack trace if error object provided

  Scenario: Child loggers preserve context
    Given a request with requestId "req-abc"
    When a child logger is created with context { requestId: "req-abc" }
    Then all logs from child logger should include requestId
    And child logger should not affect parent logger context
```

**Implementation Notes**:

- Configure Pino in `watt.json` globally
- Use `pino-pretty` transport for development
- Child loggers for request-scoped context
- Avoid logging sensitive data (passwords, tokens)

#### Task 3.1.3: Correlation ID middleware [2h]

```gherkin
Feature: Request Correlation ID
  As a DevOps engineer
  I want to trace requests across services
  So that I can debug issues in distributed systems

  Scenario: Generate correlation ID for new requests
    Given a request without X-Request-ID header
    When the request enters the gateway
    Then a unique correlation ID should be generated (UUID v4)
    And correlation ID should be added to request context
    And response should include "X-Request-ID" header

  Scenario: Preserve existing correlation ID
    Given a request with X-Request-ID header "req-existing"
    When the request enters the gateway
    Then correlation ID should remain "req-existing"
    And response should include "X-Request-ID: req-existing"

  Scenario: Propagate correlation ID to downstream services
    Given a request with correlation ID "req-123"
    When gateway proxies request to thc-db
    Then X-Request-ID header should be forwarded
    And thc-db logs should include requestId "req-123"

  Scenario: Correlation ID appears in all logs
    Given a request with correlation ID "req-xyz"
    When the request is processed
    Then all log entries should include:
      """
      {
        "requestId": "req-xyz",
        "msg": "..."
      }
      """
```

**Implementation Notes**:

- Fastify hook: `onRequest` to generate/extract requestId
- Use `fastify-request-id` plugin or custom implementation
- Store requestId in `request.id` for access in handlers
- Propagate via headers to downstream services

#### Task 3.1.4: Centralized error handler [3h]

```gherkin
Feature: Centralized Error Handling
  As a developer
  I want consistent error responses
  So that clients can handle errors predictably

  Scenario: Validation error (400)
    Given a POST request with invalid data
    When validation fails
    Then response status should be 400
    And response body should be:
      """
      {
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "Invalid input",
          "details": ["email: must be valid email"],
          "requestId": "req-123"
        }
      }
      """

  Scenario: Not found error (404)
    Given a GET request for non-existent resource
    When handler throws NotFoundError
    Then response status should be 404
    And response body should be:
      """
      {
        "error": {
          "code": "NOT_FOUND",
          "message": "Resource not found",
          "requestId": "req-123"
        }
      }
      """

  Scenario: Internal server error (500)
    Given a request that triggers unexpected error
    When handler throws generic Error
    Then response status should be 500
    And response body should NOT include stack trace
    And error should be logged with FATAL level
    And log should include full stack trace and requestId

  Scenario: Custom business errors
    Given a handler that throws custom error (e.g., InsufficientFundsError)
    When error has statusCode property
    Then response status should match error.statusCode
    And error code should be derived from error class name

  Scenario: Sensitive data not exposed
    Given an error with database connection string in message
    When error is returned to client
    Then response should show generic message
    And full error details should only be logged server-side
```

**Implementation Notes**:

- Fastify `setErrorHandler` to catch all errors
- Error classes: `ValidationError`, `NotFoundError`, `ForbiddenError`, etc.
- Never expose internal details (DB errors, file paths) to clients
- Log errors with correlation ID for debugging

---

## 📋 Story 3.2: Telemetry Stack Base

**Story Points**: 8  
**Estimated Hours**: 12h  
**Priority**: P0 (Must Have)

### Business Context

Metrics enable:

- **SLA Monitoring**: Track uptime, latency, error rate
- **Capacity Planning**: Identify when to scale
- **Anomaly Detection**: Spot issues before they become outages

### Acceptance Criteria (BDD)

#### Task 3.2.1: Docker Compose stack (Prometheus + Grafana) [3h]

```gherkin
Feature: Local Observability Stack
  As a developer
  I want Prometheus and Grafana running locally
  So that I can test metrics and dashboards during development

  Scenario: Start observability stack
    Given docker-compose.observability.yml exists
    When I run "docker-compose -f docker-compose.observability.yml up -d"
    Then Prometheus should start on http://localhost:9090
    And Grafana should start on http://localhost:3001
    And Prometheus should have scrape config for gateway
    And Grafana should have Prometheus datasource pre-configured

  Scenario: Prometheus scrapes metrics
    Given observability stack is running
    And Watt gateway is running with /metrics endpoint
    When Prometheus scrapes every 15 seconds
    Then Prometheus targets page should show gateway as "UP"
    And Prometheus should store metrics in TSDB

  Scenario: Grafana datasource works
    Given Grafana is running
    When I access http://localhost:3001
    Then I should see login page (admin/admin)
    And Prometheus datasource should be configured
    And I should be able to query metrics in Explore view

  Scenario: Cleanup volumes
    Given observability stack is running
    When I run "docker-compose -f docker-compose.observability.yml down -v"
    Then Prometheus data volume should be deleted
    And Grafana data volume should be deleted
```

**Implementation Notes**:

- `docker-compose.observability.yml` in project root
- Prometheus config: `prometheus.yml` with scrape targets
- Grafana provisioning: datasource + dashboard auto-import
- Volumes for data persistence during development

#### Task 3.2.2: Prometheus metrics for Watt services [4h]

```gherkin
Feature: Prometheus Metrics Export
  As a DevOps engineer
  I want standardized metrics from all services
  So that I can monitor system health and performance

  Scenario: HTTP metrics available
    Given Watt gateway is running
    When I GET "/metrics"
    Then response should include Prometheus format metrics:
      """
      # HELP http_requests_total Total HTTP requests
      # TYPE http_requests_total counter
      http_requests_total{method="GET",route="/api/users",status="200"} 42

      # HELP http_request_duration_seconds HTTP request latency
      # TYPE http_request_duration_seconds histogram
      http_request_duration_seconds_bucket{method="GET",route="/api/users",le="0.1"} 40
      http_request_duration_seconds_bucket{method="GET",route="/api/users",le="0.5"} 42
      http_request_duration_seconds_sum{method="GET",route="/api/users"} 3.14
      http_request_duration_seconds_count{method="GET",route="/api/users"} 42
      """

  Scenario: Node.js process metrics
    Given service is running
    When I scrape /metrics
    Then metrics should include:
      | metric                         | description             |
      | nodejs_heap_size_total_bytes   | V8 heap size            |
      | nodejs_heap_size_used_bytes    | V8 heap used            |
      | nodejs_eventloop_lag_seconds   | Event loop lag          |
      | process_cpu_seconds_total      | CPU time                |

  Scenario: Custom business metrics
    Given a service with business logic
    When custom metric is registered:
      """javascript
      const activeUsers = new prometheus.Gauge({
        name: 'active_users_total',
        help: 'Number of active users',
      });
      ```
    Then metric should be exposed on /metrics
    And metric should be queryable in Prometheus

  Scenario: Metrics follow naming conventions
    Given any metric exported
    Then metric name should use snake_case
    And metric should include unit suffix (_total, _seconds, _bytes)
    And metric should have descriptive HELP text
```

**Implementation Notes**:

- Use `prom-client` library for Node.js
- Fastify plugin: `fastify-metrics` or custom
- Default metrics: CPU, memory, event loop
- Custom metrics: gauges, counters, histograms
- Endpoint: `/metrics` on gateway

#### Task 3.2.3: Grafana dashboard base [3h]

```gherkin
Feature: Grafana Monitoring Dashboard
  As a DevOps engineer
  I want a pre-built dashboard
  So that I can monitor system health without manual setup

  Scenario: HTTP request rate panel
    Given Grafana dashboard is loaded
    When I view the "HTTP Request Rate" panel
    Then it should display requests per second
    And it should use query: rate(http_requests_total[5m])
    And it should group by service and method

  Scenario: Error rate panel
    Given Grafana dashboard is loaded
    When I view the "Error Rate" panel
    Then it should display percentage of 5xx errors
    And it should use query:
      """promql
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total[5m]))
      * 100
      """
    And threshold should be set at 5% (warning)

  Scenario: Latency (p95, p99) panel
    Given Grafana dashboard is loaded
    When I view the "Request Latency" panel
    Then it should display p95 and p99 latency
    And it should use histogram_quantile(0.95, ...)
    And it should show trend over last 1 hour

  Scenario: Node.js memory panel
    Given Grafana dashboard is loaded
    When I view the "Memory Usage" panel
    Then it should display heap used vs heap total
    And it should alert if heap > 80% full

  Scenario: Dashboard version control
    Given dashboard is created in Grafana
    When dashboard is exported as JSON
    Then JSON file should be saved in docs/observability/dashboards/
    And dashboard should be auto-imported on Grafana startup
```

**Implementation Notes**:

- Grafana dashboard JSON: `docs/observability/dashboards/main.json`
- Provisioning config: `grafana/provisioning/dashboards/default.yml`
- Use variables for service selection
- Time range: Last 1 hour (configurable)

#### Task 3.2.4: Basic alerting (error rate > 5%) [2h]

```gherkin
Feature: Prometheus Alerting
  As a DevOps engineer
  I want automatic alerts for high error rates
  So that I can respond to incidents proactively

  Scenario: Alert fires when error rate exceeds threshold
    Given Prometheus alerting rules configured
    And error rate is 6% for 5 minutes
    When Prometheus evaluates rules
    Then alert "HighErrorRate" should fire
    And alert should include labels:
      | label    | value      |
      | severity | critical   |
      | service  | thc-db     |
    And alert should include annotations:
      | key         | value                              |
      | summary     | "High error rate: 6%"              |
      | description | "Service thc-db error rate > 5%"   |

  Scenario: Alert resolves when error rate drops
    Given "HighErrorRate" alert is firing
    And error rate drops to 2% for 5 minutes
    When Prometheus evaluates rules
    Then alert should resolve
    And alert should no longer appear in Alertmanager

  Scenario: Alert visible in Grafana
    Given "HighErrorRate" alert is firing
    When I view Grafana dashboard
    Then alert should be visible in top bar
    And dashboard panel should be highlighted in red

  Scenario: Webhook notification (optional)
    Given Alertmanager is configured with webhook
    And alert fires
    When Alertmanager sends notification
    Then POST request should be sent to webhook URL
    And payload should include alert details (JSON)
```

**Implementation Notes**:

- Prometheus alerting rules: `prometheus/alerts.yml`
- Alert rule example:
  ```yaml
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total[5m]))
      > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
  ```
- Alertmanager config: `alertmanager.yml` (optional webhook)

---

## 📋 Story 3.3: Admin API + Panel MVP

**Story Points**: 5  
**Estimated Hours**: 7h  
**Priority**: P1 (Should Have)

### Business Context

Admin dashboard provides:

- **Operational Visibility**: Quick health overview
- **Troubleshooting**: View recent errors and logs
- **Governance**: Track deployments and versions

### Acceptance Criteria (BDD)

#### Task 3.3.1: Admin service endpoint /admin/status [2h]

```gherkin
Feature: Admin Status Endpoint
  As an administrator
  I want a single endpoint to check system health
  So that I can quickly assess if everything is running

  Scenario: Get system status (all services healthy)
    Given all Watt services are running
    And no errors in last 5 minutes
    When I GET "/admin/api/status"
    Then response status should be 200
    And response body should be:
      """json
      {
        "status": "healthy",
        "timestamp": "2025-12-14T10:30:00Z",
        "version": "0.4.0",
        "services": [
          {
            "name": "thc-db",
            "status": "up",
            "health": {
              "live": "ok",
              "ready": "ok"
            },
            "uptime": 3600
          },
          {
            "name": "thc-gateway",
            "status": "up",
            "health": {
              "live": "ok",
              "ready": "ok"
            },
            "uptime": 3600
          }
        ],
        "metrics": {
          "memoryUsageMB": 120,
          "cpuUsagePercent": 15,
          "requestsPerSecond": 42
        },
        "recentErrors": []
      }
      ```

  Scenario: Get system status (one service down)
    Given thc-db is not responding
    When I GET "/admin/api/status"
    Then response status should be 200
    And status should be "degraded"
    And services[0].status should be "down"
    And recentErrors should include database connection error

  Scenario: Recent errors summary
    Given 3 errors occurred in last 5 minutes
    When I GET "/admin/api/status"
    Then recentErrors array should contain 3 entries
    And each entry should include:
      | field     | description              |
      | timestamp | ISO 8601 timestamp       |
      | service   | Service name             |
      | message   | Error message            |
      | requestId | Correlation ID           |

  Scenario: Authentication required (future)
    Given endpoint requires authentication
    When I GET "/admin/api/status" without token
    Then response status should be 401
    And response should be:
      """json
      {
        "error": {
          "code": "UNAUTHORIZED",
          "message": "Authentication required"
        }
      }
      ```
```

**Implementation Notes**:

- Create new service: `web/thc-admin/`
- Endpoint: `/admin/api/status`
- Call health endpoints of all services
- Aggregate results
- Future: JWT authentication

#### Task 3.3.2: React admin UI skeleton [3h]

```gherkin
Feature: Admin UI Dashboard
  As an administrator
  I want a web interface to view system status
  So that I don't need to use curl or Postman

  Scenario: View services status grid
    Given admin UI is loaded at /admin
    When page renders
    Then I should see a grid of service cards
    And each card should show:
      | field        | example        |
      | Service name | "thc-db"       |
      | Status icon  | 🟢 (green)     |
      | Uptime       | "1h 23m"       |
      | Last check   | "2s ago"       |

  Scenario: Service status colors
    Given services with different health states
    Then healthy service should show green indicator
    And degraded service should show yellow indicator
    And down service should show red indicator

  Scenario: Auto-refresh every 10 seconds
    Given admin UI is loaded
    When 10 seconds elapse
    Then UI should fetch /admin/api/status again
    And status display should update automatically
    And no page reload should occur

  Scenario: Recent errors list
    Given there are recent errors
    When I view the "Recent Errors" section
    Then I should see a list of errors
    And each error should show timestamp, service, message
    And clicking an error should show full details (requestId, stack)

  Scenario: Responsive design
    Given admin UI is loaded on mobile
    Then service grid should stack vertically
    And all information should be readable
    And UI should use Tailwind CSS for styling
```

**Implementation Notes**:

- Vite + React + TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- Auto-refresh with `useQuery({ refetchInterval: 10000 })`
- Service status components: `<ServiceCard />`, `<ErrorList />`

#### Task 3.3.3: Serve UI from Gateway /admin [2h]

```gherkin
Feature: Admin UI Integration with Gateway
  As an administrator
  I want to access admin UI from gateway
  So that I have a single entry point for all services

  Scenario: Serve static files from /admin
    Given admin UI is built to dist/
    When I GET "/admin"
    Then gateway should serve index.html
    And response should include HTML with React app

  Scenario: Proxy API requests to admin service
    Given admin service is running
    When I GET "/admin/api/status" from browser
    Then gateway should proxy request to admin service
    And response should come from admin service
    And CORS headers should be set correctly

  Scenario: SPA routing works
    Given I am on /admin/dashboard
    When I refresh the page
    Then gateway should serve index.html (not 404)
    And React Router should handle /dashboard route

  Scenario: No CORS errors
    Given admin UI makes fetch to /admin/api/status
    Then request should succeed
    And no CORS errors should appear in browser console
```

**Implementation Notes**:

- Gateway config: proxy `/admin/api/*` to admin service
- Gateway config: serve static files from `/admin/*`
- Fastify plugin: `@fastify/static` for serving built UI
- Handle SPA routes: serve `index.html` for all `/admin/*` paths except `/admin/api/*`

---

## 📦 Deliverables

### Code Artifacts

- [x] Health endpoints implemented (`/health/live`, `/health/ready`) for all services
- [x] Pino logger configured globally with correlation ID
- [ ] Error handler middleware with standard error format
- [ ] Docker Compose: `docker-compose.observability.yml` (Prometheus + Grafana)
- [ ] Prometheus metrics exposed on `/metrics`
- [ ] Grafana dashboard JSON (`docs/observability/dashboards/main.json`)
- [ ] Alerting rules configured (`prometheus/alerts.yml`)
- [ ] Admin service with `/admin/api/status` endpoint
- [ ] React admin UI skeleton with service status grid
- [ ] Gateway integration: serve admin UI at `/admin`

### Documentation

- [ ] `docs/guides/14-health-checks-logging.md` - Health check patterns and logging strategy
- [ ] `docs/guides/15-observability-stack.md` - Prometheus, Grafana, alerting setup
- [ ] `docs/guides/16-admin-dashboard.md` - Admin UI architecture and usage
- [ ] ADR-004: Observability stack choice (Prometheus vs Datadog vs NewRelic)
- [ ] `README.md` updated with observability stack instructions

### Tests

- [x] Health endpoint tests (integration) - 9/9 passing
- [x] Correlation ID middleware tests (integration) - 4/4 passing
- [ ] Error handler tests (unit + integration)
- [ ] Metrics endpoint tests (integration)
- [ ] Admin API tests (integration)

---

## 🚦 Definition of Done

- [x] All BDD scenarios pass (green) - **13/13 tests passing** ✅
- [x] Health checks return 200 for healthy services, 503 for unhealthy
- [x] Correlation ID appears in all logs
- [x] Correlation ID plugin works with both inject() and real server
- [ ] Error responses follow standard format with requestId
- [ ] Prometheus scrapes metrics successfully
- [ ] Grafana dashboard displays request rate, error rate, latency, memory
- [ ] Alert fires when error rate > 5% for 5 minutes
- [ ] Admin UI shows all services status with auto-refresh
- [ ] Gateway serves admin UI at `/admin` without CORS errors
- [ ] Code coverage > 70%
- [ ] All tests pass (`npm test`)
- [ ] All quality checks pass (`npm run verify`)
- [ ] Documentation complete and reviewed
- [ ] Demo-able to stakeholders

---

## 🎯 Success Metrics

| Metric                        | Target       | How to Measure                                     |
| ----------------------------- | ------------ | -------------------------------------------------- |
| **MTTR (Mean Time to Repair)** | < 30 minutes | Time from alert to resolution (simulated incident) |
| **Dashboard Load Time**       | < 2 seconds  | Admin UI initial load time                         |
| **Metrics Scrape Latency**    | < 500ms      | Prometheus scrape duration for /metrics            |
| **Alert Accuracy**            | > 95%        | True positives / (True positives + False positives) |
| **Log Query Speed**           | < 5 seconds  | Grep for requestId across all services            |

---

## 🔄 Follow-up Epics

### EPIC-004: Advanced Observability (Future)

- Distributed tracing (Jaeger/Tempo)
- Log aggregation (Loki/ELK)
- Error tracking (Sentry)
- APM (Application Performance Monitoring)

### EPIC-007: Admin Dashboard Advanced Features (Future)

- Real-time log viewer
- Deploy history
- Feature flags management
- User management

---

## 📚 References

- [Platformatic Watt Observability Guide](../guides/01-guida-completa-platformatic-watt.md)
- [Health Check Patterns](../guides/10-observability-design.md)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [The Twelve-Factor App: Logs](https://12factor.net/logs)
- [Google SRE Book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

---

**Created**: 2025-12-14  
**Status**: 🟡 PLANNED  
**Owner**: @dev-team  
**Sprint**: Sprint 3 (Week of 2025-12-16)
