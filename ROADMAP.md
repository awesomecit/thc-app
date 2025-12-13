# Sprint Planning & Project Roadmap

## 🎯 Sprint Management Rules (Extreme Programming)

### Core Principles

- **Sprint Duration**: 1 week (5 working days)
- **Timebox**: Each task MUST fit in 2-8 hours
- **Velocity**: Measured in completed tasks per sprint (not story points)
- **Team Composition**: 1-2 developers (scalable)
- **Daily Stand-up**: 15 minutes max, 3 questions only
- **Retrospective**: End of sprint, 30 minutes max

### Timebox Rules

```
Task Duration Limits:
├── XS: 2 hours   → Simple config, documentation
├── S:  4 hours   → Single feature implementation
├── M:  6 hours   → Feature + tests
└── L:  8 hours   → Complex feature with integration

❌ Tasks > 8 hours must be split into smaller tasks
✅ Aim for 6-8 tasks per developer per sprint
```

### Task Status

- **TODO**: Not started
- **IN PROGRESS**: Currently working (max 1 per developer)
- **BLOCKED**: Waiting for dependency
- **DONE**: Completed and merged to main
- **CANCELLED**: No longer needed (explain why - YAGNI)

### Velocity Tracking

```
Sprint Velocity = Completed Tasks / Sprint
Team Capacity = Developers × 40h per week
Task Completion Rate = (Completed / Planned) × 100%
```

### Quality Gates (Must Pass Before "DONE")

1. ✅ Code passes linting (ESLint)
2. ✅ Code is formatted (Prettier)
3. ✅ Tests pass (if applicable)
4. ✅ No secrets in code (secret scan)
5. ✅ Conventional commit format
6. ✅ Merged to main

---

## 📋 Project Roadmap

### EPIC-001: Developer Experience Automation

**Goal**: Automate quality gates and enforce conventions from day one  
**Team**: 1 developer  
**Estimated Sprints**: 2

#### Sprint 1: Foundation Setup

- **Story 1.1**: Git Hooks & Pre-commit Automation
  - Task 1.1.1: Install and configure Husky [4h]
  - Task 1.1.2: Setup lint-staged for incremental linting [2h]
  - Task 1.1.3: Configure Prettier with prose wrap for docs [2h]
  - Task 1.1.4: Create secret scanning script [4h]

- **Story 1.2**: Commit Validation
  - Task 1.2.1: Install commitlint with conventional config [2h]
  - Task 1.2.2: Configure commit-msg hook [2h]
  - Task 1.2.3: Document commit message examples [2h]

#### Sprint 2: Advanced Automation

- **Story 2.1**: Code Quality Enforcement
  - Task 2.1.1: Configure ESLint with SonarJS plugin [4h]
  - Task 2.1.2: Set complexity limits (cognitive <10, cyclomatic <10) [2h]
  - Task 2.1.3: Add pre-push hooks for build verification [2h]

- **Story 2.2**: Semantic Versioning Automation
  - Task 2.2.1: Create auto-release script based on commits [6h]
  - Task 2.2.2: Configure CHANGELOG generation [2h]
  - Task 2.2.3: Document release workflow [2h]

---

### EPIC-002: Documentation as Code Infrastructure

**Goal**: Treat documentation with same rigor as production code  
**Team**: 1 developer  
**Estimated Sprints**: 1

#### Sprint 3: Documentation Pipeline

- **Story 3.1**: Validation & Formatting
  - Task 3.1.1: Add markdown linting rules [2h]
  - Task 3.1.2: Configure automated link checking [4h]
  - Task 3.1.3: Setup documentation build pipeline [4h]

- **Story 3.2**: ADR Workflow
  - Task 3.2.1: Create first ADR for platform choice [2h]
  - Task 3.2.2: Add ADR validation script [4h]
  - Task 3.2.3: Document ADR creation workflow [2h]

---

### EPIC-003: Testing Infrastructure Foundation

**Goal**: Establish testing pyramid and BDD framework  
**Team**: 1-2 developers  
**Estimated Sprints**: 2

#### Sprint 4: Unit Test Setup

- **Story 4.1**: Jest Configuration
  - Task 4.1.1: Install and configure Jest for unit tests [4h]
  - Task 4.1.2: Setup coverage thresholds (70%) [2h]
  - Task 4.1.3: Create example unit test suite [4h]

- **Story 4.2**: Test Utilities
  - Task 4.2.1: Create in-memory test adapters [6h]
  - Task 4.2.2: Setup test data factories [4h]
  - Task 4.2.3: Document testing patterns [2h]

#### Sprint 5: Integration & E2E Tests

- **Story 5.1**: Testcontainers Setup
  - Task 5.1.1: Configure Testcontainers for Postgres [4h]
  - Task 5.1.2: Configure Testcontainers for Redis [2h]
  - Task 5.1.3: Create integration test examples [6h]

- **Story 5.2**: BDD with Cucumber
  - Task 5.2.1: Install and configure Cucumber [4h]
  - Task 5.2.2: Create feature file template [2h]
  - Task 5.2.3: Implement first step definitions [6h]

---

### EPIC-004: CI/CD Pipeline

**Goal**: Automate build, test, and deployment  
**Team**: 1 developer  
**Estimated Sprints**: 1

#### Sprint 6: GitHub Actions Setup

- **Story 6.1**: Basic Pipeline
  - Task 6.1.1: Create test workflow (unit + integration) [4h]
  - Task 6.1.2: Add linting and formatting checks [2h]
  - Task 6.1.3: Configure coverage reporting [2h]

- **Story 6.2**: Deployment Automation
  - Task 6.2.1: Create Docker build workflow [4h]
  - Task 6.2.2: Add semantic release automation [4h]
  - Task 6.2.3: Document deployment process [2h]

---

### EPIC-012: Admin Dashboard Telemetria

**Goal**: Monitoring dashboard for system health and metrics  
**Team**: 1-2 developers  
**Estimated Sprints**: 3  
**Status**: Detailed spec in `docs/examples/EPIC-012-ADMIN-DASHBOARD-TELEMETRIA.md`

#### Sprint 7: Backend - Metrics Collection

- **Story 12.1**: Prometheus Integration
  - Task 12.1.1: Install prom-client and configure registry [2h]
  - Task 12.1.2: Create metrics service with counters/gauges [4h]
  - Task 12.1.3: Add HTTP request duration histogram [4h]
  - Task 12.1.4: Expose /metrics endpoint [2h]

- **Story 12.2**: Health Check Endpoints
  - Task 12.2.1: Implement /health/live (liveness) [2h]
  - Task 12.2.2: Implement /health/ready (readiness) [4h]
  - Task 12.2.3: Add dependency health checks (DB, Redis) [4h]

#### Sprint 8: Backend - Data Persistence

- **Story 12.3**: Telemetry Data Storage
  - Task 12.3.1: Design telemetry schema (Postgres) [4h]
  - Task 12.3.2: Create migration scripts [2h]
  - Task 12.3.3: Implement telemetry repository [6h]

- **Story 12.4**: API Endpoints
  - Task 12.4.1: GET /api/metrics/summary endpoint [4h]
  - Task 12.4.2: GET /api/metrics/timeseries endpoint [4h]
  - Task 12.4.3: Add filtering and pagination [4h]

#### Sprint 9: Frontend - Dashboard UI

- **Story 12.5**: Dashboard Layout
  - Task 12.5.1: Setup Next.js app in Watt structure [4h]
  - Task 12.5.2: Create dashboard shell with navigation [4h]
  - Task 12.5.3: Implement responsive grid layout [4h]

- **Story 12.6**: Metrics Visualization
  - Task 12.6.1: Integrate Chart.js for time series [4h]
  - Task 12.6.2: Create metrics cards (uptime, requests, errors) [6h]
  - Task 12.6.3: Add real-time WebSocket updates [6h]

---

### EPIC-005: Platformatic Watt Multi-App Structure

**Goal**: Implement modular monolith architecture  
**Team**: 1-2 developers  
**Estimated Sprints**: 2

#### Sprint 10: Gateway & Core Services

- **Story 5.1**: Gateway Setup
  - Task 5.1.1: Create gateway application with routing [4h]
  - Task 5.1.2: Configure proxy mappings for services [2h]
  - Task 5.1.3: Add CORS and security headers [2h]

- **Story 5.2**: Auth Service (NestJS)
  - Task 5.2.1: Create auth-service with NestJS [6h]
  - Task 5.2.2: Implement Keycloak adapter [6h]
  - Task 5.2.3: Add session management with Redis [4h]

#### Sprint 11: Supporting Services

- **Story 5.3**: Telemetry Service
  - Task 5.3.1: Move telemetry logic to dedicated service [4h]
  - Task 5.3.2: Configure inter-service communication [4h]
  - Task 5.3.3: Add service discovery patterns [4h]

- **Story 5.4**: Integration & Documentation
  - Task 5.4.1: Test full gateway routing [4h]
  - Task 5.4.2: Document service URLs and contracts [2h]
  - Task 5.4.3: Create architecture diagram [2h]

---

## 📊 Sprint Tracking Template

### Sprint N: [Sprint Goal]

**Dates**: YYYY-MM-DD to YYYY-MM-DD  
**Team**: [Developer names]  
**Capacity**: [Total hours available]

| Task ID | Description | Estimate | Actual | Status | Assignee |
|---------|-------------|----------|--------|--------|----------|
| X.X.X   | Task name   | Xh       | Xh     | TODO   | Name     |

**Velocity**: X tasks completed / Y tasks planned = Z%  
**Blockers**: [List any impediments]  
**Notes**: [Sprint retrospective findings]

---

## 📈 Velocity History

| Sprint | Planned Tasks | Completed Tasks | Velocity | Completion Rate |
|--------|---------------|-----------------|----------|-----------------|
| 1      | 8             | TBD             | TBD      | TBD             |
| 2      | 8             | TBD             | TBD      | TBD             |

**Target Velocity**: 6-8 tasks per developer per sprint  
**Current Average**: TBD (after 3 sprints)

---

## 🎯 Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Sprint Completion Rate | >80% | TBD | 🟡 |
| Lead Time (Task → Done) | <3 days | TBD | 🟡 |
| Bugs in Production | <5% | TBD | 🟡 |
| Code Coverage | >70% | TBD | 🟡 |
| Build Time | <5 min | TBD | 🟡 |

---

**Last Updated**: 2025-12-13  
**Next Review**: End of Sprint 1
