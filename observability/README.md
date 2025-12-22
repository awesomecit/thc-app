# Observability Stack

This directory contains the observability configuration for the THC Platform, including Prometheus
for metrics collection and Grafana for visualization.

## Quick Start

### Start the observability stack

```bash
docker-compose -f docker-compose.observability.yml up -d
```

### Access the services

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin` (change on first login)

### Stop the stack

```bash
docker-compose -f docker-compose.observability.yml down
```

### Stop and remove volumes (clean slate)

```bash
docker-compose -f docker-compose.observability.yml down -v
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     THC Platform Services                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Watt Gateway │  │  API Core    │  │  Frontend    │     │
│  │  :3042       │  │  :3043       │  │  :3000       │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │ /metrics        │ /metrics        │ /metrics     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          │                 │                 │
          ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────┐
    │         Prometheus (:9090)                  │
    │  • Scrapes metrics every 15s                │
    │  • Stores TSDB with 15 days retention       │
    │  • Evaluates alert rules                    │
    └──────────────────┬──────────────────────────┘
                       │
                       │ PromQL queries
                       ▼
             ┌──────────────────────┐
             │  Grafana (:3001)     │
             │  • Pre-configured     │
             │    datasource         │
             │  • Auto-loaded        │
             │    dashboards         │
             └──────────────────────┘
```

## Directory Structure

```
observability/
├── prometheus/
│   ├── prometheus.yml       # Main Prometheus config
│   └── alerts.yml          # Alert rules
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/    # Auto-configured datasources
│   │   │   └── prometheus.yml
│   │   └── dashboards/     # Dashboard provisioning config
│   │       └── default.yml
│   └── dashboards/         # Dashboard JSON files
│       └── platform-overview.json
└── README.md               # This file
```

## Configuration

### Prometheus

**Scrape Targets**: Defined in `prometheus/prometheus.yml`

- `watt-gateway`: http://host.docker.internal:3042/metrics
- Add more services as they expose `/metrics` endpoints

**Alert Rules**: Defined in `prometheus/alerts.yml`

- `ServiceDown`: Service unreachable for >1 minute
- `HighErrorRate`: HTTP 5xx errors >5% over 5 minutes
- `HighLatency`: p95 latency >500ms over 5 minutes
- `HighMemoryUsage`: Heap usage >80%
- `HighEventLoopLag`: Event loop lag >100ms

### Grafana

**Datasource**: Prometheus is auto-configured on startup via provisioning.

**Dashboards**: Auto-loaded from `grafana/dashboards/` on startup.

- `platform-overview.json`: Main dashboard with HTTP requests, error rate, latency, memory usage

## Development Workflow

### 1. Start the stack

```bash
docker-compose -f docker-compose.observability.yml up -d
```

### 2. Start your Watt services

Ensure your services expose a `/metrics` endpoint (see Task 3.2.2).

```bash
npm run dev
```

### 3. Verify metrics collection

Open Prometheus: http://localhost:9090

- Go to **Status → Targets**
- Check that `watt-gateway` is **UP** (green)

### 4. View dashboards

Open Grafana: http://localhost:3001

- Login with `admin/admin`
- Navigate to **Dashboards → THC Platform Overview**

### 5. Explore metrics

In Grafana, use **Explore** to query metrics:

```promql
# Request rate by service
sum(rate(http_requests_total[5m])) by (service)

# Error rate
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# p95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

## Troubleshooting

### Prometheus can't scrape targets

**Symptom**: Prometheus shows target as **DOWN** with error "connection refused"

**Solution**:

1. Verify service is running: `curl http://localhost:3042/metrics`
2. Check Docker network: `docker network inspect thc-observability`
3. On macOS/Windows, use `host.docker.internal` instead of `localhost` in `prometheus.yml`

### Grafana shows "No data"

**Symptom**: Dashboard panels show "No data"

**Solution**:

1. Check Prometheus datasource: **Configuration → Data Sources → Prometheus**
2. Click **Test** - should show "Data source is working"
3. Verify Prometheus has data: http://localhost:9090/graph
4. Check time range in Grafana (top-right) - try "Last 1 hour"

### Alert not firing

**Symptom**: Alert rule shows as "inactive" in Prometheus

**Solution**:

1. Check alert rule syntax: http://localhost:9090/alerts
2. Verify metric exists: Use **Graph** tab to query the metric
3. Check `for` duration - alert may not have been in firing state long enough

## Environment Variables

Override defaults in `.env`:

```bash
# Prometheus
PROMETHEUS_VERSION=v2.48.0
PROMETHEUS_PORT=9090

# Grafana
GRAFANA_VERSION=10.2.3
GRAFANA_PORT=3001
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin

# Project name (affects container names)
COMPOSE_PROJECT_NAME=thc
```

## Next Steps

- **Task 3.2.2**: Implement `/metrics` endpoint in Watt services
- **Task 3.2.3**: Add more dashboards (per-service, database, etc.)
- **Task 3.2.4**: Configure Alertmanager for notifications

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
