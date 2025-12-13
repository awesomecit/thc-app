# AI Agent Instructions for THC-App Project

## Project Overview

This is a **documentation repository** for building healthcare applications with Platformatic Watt.
It contains comprehensive guides, architectural principles, and workflow documentation—**not a
runnable codebase**. The content is contextualised for healthcare/clinical systems but the
principles apply broadly to enterprise applications.

## Core Philosophy: The "Regola Zero" (Rule Zero)

**Before producing ANYTHING** (file, function, interface, component), stop and ask:

1. **Do I really need this?** (Not "might need", but "solves a real problem NOW")
2. **Why do I need this?** (Explain in one sentence)
3. **What are the trade-offs?** (Pros AND cons)
4. **What alternatives exist?** (Maybe it already exists, maybe simpler is better)

This filter applies to every decision—before accepting AI suggestions, before creating abstractions,
before adding dependencies.

## Documentation Structure

- `01-guida-completa-platformatic-watt.md` - Complete Watt guide: architecture, NestJS integration,
  Platformatic DB, configuration patterns
- `02-principi-architetturali-esagonale-solid.md` - Hexagonal architecture, SOLID/DRY/KISS/YAGNI,
  Clean Architecture, Extreme Programming with timeboxing
- `03-cloud-deployment-docker-k8s.md` - Deployment: multi-stage Dockerfile, Docker Compose,
  Kubernetes manifests, health checks, PaaS platforms, CI/CD pipelines
- `04-sviluppo-ai-assisted-copilot-claude.md` - AI-assisted development philosophy, effective
  Copilot usage, anti-patterns
- `05-bdd-tdd-acceptance-criteria-workflow.md` - Complete workflow from Acceptance Criteria to
  deployable code via BDD (Gherkin) + TDD
- `06-podcast-scalette-4-episodi.md` - Podcast outlines for junior developers
- `07-riflessione-etica-ai-droga-digitale.md` - Critical analysis of AI in development
- `08-platformatic-modular-monolith-quick-reference.md` - Quick reference for modular monolith: DB
  applications, gateway composition, migrations, seeding
- `09-secrets-management-guide.md` - Secrets management: detection, .env handling, pre-commit hooks
- `10-observability-design.md` - Observability: structured logging, metrics, tracing, health checks
- `11-automatic-versioning-release-workflow.md` - Semantic versioning: conventional commits, changelog, git tags, Docker image publishing
- `12-http-caching-watt-guide.md` - HTTP caching with Watt: client-side cache, tag-based invalidation, TTL strategies, service mesh integration
- `13-platformatic-db-crud-generation-guide.md` - Platformatic DB CRUD: SQL migrations as source of truth, OpenAPI/GraphQL auto-generation, entity hooks, plugins, routes
- `DEVELOPMENT_PRATICAL_GUIDE.md` - Practical implementation guide: Git workflow, quality gates,
  testing strategy, setup checklists (based on tech-citizen-sw-gateway)

## Platformatic Watt Architecture Pattern

### Multi-Application Orchestration

Watt orchestrates multiple applications in a single server process:

```
watt-project/
├── watt.json              # Root orchestration config
├── .env                   # Shared environment variables
└── web/
    ├── gateway/           # Routes requests to applications
    │   └── platformatic.json
    ├── api-core/          # NestJS backend (business logic)
    │   ├── watt.json
    │   └── src/
    └── frontend/          # Next.js or other frontend
        └── watt.json
```

### Key Configuration Files

- **`watt.json` (root)**: Defines all applications, server port, global config
- **`platformatic.json` (gateway)**: Application routing with `proxy.prefix` mappings
- **`watt.json` (per-app)**: App-specific config, e.g., `basePath` for APIs
- **Schema validation**: All configs support JSON Schema from `https://schemas.platformatic.dev/`

### NestJS Integration Pattern

NestJS apps in Watt must export a `create()` function (not `bootstrap()`):

```typescript
export async function create() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.setGlobalPrefix('v1');
  app.enableCors();
  await app.init();
  return app.getHttpAdapter().getInstance(); // Return HTTP instance, don't call listen()
}
```

### Inter-Service Communication

Services use internal DNS: `http://<service-id>.plt.local` where `<service-id>` matches the
application ID in gateway config.

## Architectural Principles

### Hexagonal Architecture (Ports & Adapters)

- **Domain (core)**: Business logic, entities, use cases—no external dependencies
- **Ports**: Interfaces defined by domain (e.g., `PatientRepository` interface)
- **Adapters**: Implementations of ports (e.g., `PostgresPatientRepository`, `HL7Adapter`)
- Each Watt application can represent a bounded context or adapter

### Design Principles as Tensions

- **SOLID**: Not rigid rules but tensions to manage. SRP = one reason to change (per stakeholder).
  OCP = extend via new adapters without modifying domain.
- **DRY**: Avoid duplication of _knowledge_, not code. Similar code serving different purposes
  should stay separate.
- **KISS**: Complexity must earn its place. Every abstraction must solve a real problem better than
  simpler alternatives.
- **YAGNI**: Implement when needed, not when foreseen. Doesn't apply to refactoring/clean code—only
  to features.

### Vertical Slicing with Timebox

Work in small, deployable increments (hours, not days):

- ❌ **Horizontal slicing**: Sprint 1 = all DB schemas, Sprint 2 = all repos, Sprint 3 = all APIs
- ✅ **Vertical slicing**: Timebox 1 = complete "create patient" endpoint (schema + repo + use
  case + controller), immediately deployable

## Git Workflow: Trunk-Based Development

### Core Rules

1. **main is always deployable** (protected branch, CI must pass)
2. **Feature branches live < 3 days** (delete after merge)
3. **Commit early, push often** (integrate continuously)
4. **No develop branch** (YAGNI - not needed for 1-2 developers)

### Branch Naming Convention

```bash
feat/short-description    # New features
fix/issue-description     # Bug fixes
chore/task-description    # Tooling, dependencies
docs/topic                # Documentation
refactor/description      # Code refactoring
test/description          # Add/fix tests
```

### Daily Workflow

```bash
# Morning: sync with main
git checkout main && git pull

# New feature
git checkout -b feat/health-metrics
git add -A && git commit -m "feat(metrics): add Prometheus endpoint"
git push -u origin feat/health-metrics

# Create PR and merge (if CI passes)
gh pr create --fill
gh pr merge --squash --delete-branch
```

## Quality Gates & Automation Stack

### Pre-commit Checks (via Husky)

1. **lint-staged**: ESLint --fix on staged .ts/.js files
2. **Prettier --write**: Format all staged files
3. **Secret scanning**: Prevent credential leaks (check-secrets.cjs)
4. **Commitlint**: Validate commit message format

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types and Version Bumps:**

- `fix:` → PATCH (1.0.0 → 1.0.1)
- `feat:` → MINOR (1.0.0 → 1.1.0)
- `feat!:` or `BREAKING CHANGE:` → MAJOR (1.0.0 → 2.0.0)
- `docs:`, `style:`, `refactor:`, `test:`, `chore:` → No bump

**Examples:**

```bash
feat(gateway): add circuit breaker for patient-api
fix(cache): prevent race condition in Redis connection
docs(adr): add decision record for event schema
feat(auth)!: change token format to JWT

BREAKING CHANGE: Token format changed to JWT.
```

### Code Quality Tools

- **ESLint** with SonarJS rules: Cognitive complexity < 10, Cyclomatic < 10
- **Prettier**: Auto-format on save
- **Coverage threshold**: 70% minimum (lines, functions, branches)

## BDD + TDD Workflow

### From Acceptance Criteria to Code

```
User Story → Acceptance Criteria (Given-When-Then)
           ↓
Feature File (.feature Gherkin)
           ↓
Step Definitions (TypeScript - connects to app)
           ↓
TDD Unit Tests (Red → Green → Refactor)
           ↓
Implementation → cucumber.json report for client
```

### Test Organization & Strategy (Pyramid)

```
┌─────────────────────────────────────────────────────────┐
│  E2E/BDD (Cucumber/Gherkin) - ~10% - features/         │
│  ├── Full stack scenarios                              │
│  ├── Docker Compose stack required                     │
│  └── Slow but validates real user flows                │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Integration Tests (Jest/Tap) - ~20%                   │
│  ├── Test adapters/infrastructure                      │
│  ├── Testcontainers (real Keycloak, Redis, Postgres)  │
│  └── **/*.integration.spec.ts                          │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Unit Tests (Jest/Tap) - ~70%                          │
│  ├── Test domain logic + use cases                     │
│  ├── Mock ports (in-memory fakes)                      │
│  ├── Fast (<30s for full suite)                        │
│  └── **/*.spec.ts or **/*.test.ts                      │
└─────────────────────────────────────────────────────────┘
```

**Directory Structure:**

```
project/
├── features/                    # E2E BDD tests (global)
│   ├── firma-digitale/
│   │   └── *.feature           # Gherkin scenarios
│   ├── step_definitions/
│   │   └── *.steps.ts
│   ├── support/
│   │   ├── world.ts            # Shared context
│   │   └── hooks.ts            # Before/After
│   └── cucumber.json           # Client-facing report
├── packages/auth/               # Example package
│   ├── src/
│   │   ├── domain/             # Business logic
│   │   ├── application/        # Use cases + Ports
│   │   └── infrastructure/     # Adapters
│   └── test/
│       ├── unit/               # Domain + use case tests
│       └── integration/        # Adapter tests
```

**Test Commands:**

```bash
npm run test:unit              # Fast, no Docker (~182 tests in ~7s)
npm run test:integration       # With Testcontainers (~73 tests in ~6s)
npm run test:e2e               # Full stack with Docker Compose
npm run test:cov               # Coverage report (HTML)
npm test                       # Full suite: unit → integration → e2e
```

### Cucumber Tags for Test Filtering

```bash
npx cucumber-js --tags "@smoke"           # Smoke tests only (CI)
npx cucumber-js --tags "@security"        # Security tests
npx cucumber-js --tags "not @slow"        # Exclude slow tests
```

### TDD Cycle (Red-Green-Refactor)

1. 🔴 **RED**: Write failing test first
2. 🟢 **GREEN**: Write minimal code to pass
3. 🔵 **REFACTOR**: Improve while keeping tests green
4. Repeat for each small increment

## Deployment Patterns

### Docker Multi-Stage Build

1. **deps stage**: Install dependencies only (cache optimization)
2. **builder stage**: Compile TypeScript, build assets
3. **runner stage**: Minimal production image, non-root user, health checks

### Kubernetes Health Checks

- **Liveness** (`/health/live`): Is the app running? (No external dependency checks)
- **Readiness** (`/health/ready`): Can it receive traffic? (Check DB, cache, critical services)
- **Startup** probe: For slow-starting apps (prevents premature liveness failures)

### CI/CD with GitHub Actions

Typical pipeline: Test → Build Docker image → Deploy to staging → (manual approval) → Deploy to
production

- Use `npx cucumber-js --tags "@smoke"` for fast CI smoke tests
- Health check verification after deploy
- Rollback capability essential

## AI-Assisted Development Guidelines

### AI as Amplifier, Not Substitute

- AI amplifies your understanding—good understanding → faster correct code; poor understanding →
  faster wrong code
- **Paradox of productivity**: Speed enables producing more code than necessary. Apply YAGNI
  rigorously.
- Always pass AI suggestions through Regola Zero filter

### Effective Copilot Usage

- **Contextual comments**: Describe what you want with examples before writing code
- **Meaningful names**: `calculatePatientRiskScore(medicalHistory)` yields better suggestions than
  `processData(d)`
- **Open reference files**: Copilot considers open files—keep interfaces/types visible
- Copilot excels at: boilerplate, DTOs, common patterns, test setup
- Copilot struggles with: domain-specific logic, complex business rules, architectural decisions

### Code Review Checklist for AI-Generated Code

1. Do I understand every line?
2. Is this the simplest solution?
3. Are there hidden dependencies or assumptions?
4. Does it handle errors appropriately for THIS context?
5. Would I write this code without AI assistance?

## Common Patterns

### Environment Variables

Use `{VARIABLE_NAME}` notation in JSON configs:

```json
{
  "server": { "port": "{PLT_SERVER_PORT}" },
  "db": { "connectionString": "{DATABASE_URL}" }
}
```

Root `.env` file is shared across all Watt applications.

### Code Quality Limits

Apply these limits to maintain readable, maintainable code:

- **Cognitive Complexity**: < 10 (SonarJS rule)
- **Cyclomatic Complexity**: < 10 (ESLint rule)
- **Max lines per function**: ~50 (warn level)
- **Coverage threshold**: 70% (lines, functions, branches, statements)

### Package.json Essential Scripts

````json
{
  "scripts": {
    "dev": "npx wattpm dev",
    "build": "tsc",
    "start": "node dist/index.js",

    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --config jest.config.cjs",
    "test:integration": "jest --config jest.integration.config.cjs",
    "test:e2e": "cucumber-js",
    "test:cov": "jest --coverage",
    "test:watch": "jest --watch",

    "lint": "eslint . --fix",
    "lint:check": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",

    "verify": "npm run format:check && npm run lint:check && npm test && npm run build",

    "release:suggest": "node scripts/auto-release.js --dry-run",
    "release": "node scripts/auto-release.js",

    "prepare": "husky"
  }
}

## When Modifying This Documentation

1. **Preserve the Regola Zero philosophy** - it's the foundation of all guidance
2. **Keep examples concrete** - reference actual files and patterns from the docs
3. **Maintain the healthcare context** where present (can be abstracted but don't lose specificity)
4. **Update cross-references** when moving content between files
5. **Verify consistency** across architectural principles (hexagonal, SOLID, Clean Architecture all reinforce each other)

## Project Setup Checklist (New Repository)

### Initial Setup
```bash
# 1. Initialize project
npm init -y
git init
echo "22" > .nvmrc
echo "engine-strict=true" > .npmrc

# 2. Install dev dependencies
npm install -D typescript @types/node \
  eslint @eslint/js typescript-eslint eslint-plugin-sonarjs \
  eslint-config-prettier prettier \
  husky lint-staged @commitlint/cli @commitlint/config-conventional \
  jest @types/jest ts-jest \
  testcontainers @cucumber/cucumber

# 3. Initialize tooling
npx tsc --init
npx husky init
````

### Required Config Files

- `eslint.config.mjs` - ESLint with SonarJS rules
- `commitlint.config.cjs` - Conventional Commits validation
- `.prettierrc` - Code formatting rules
- `jest.config.cjs` - Unit test configuration
- `jest.integration.config.cjs` - Integration test config
- `cucumber.js` - BDD test configuration
- `.husky/pre-commit` - Lint + format + secret scan
- `.husky/commit-msg` - Commitlint validation
- `.env.example` - Environment variables template

### Directory Structure

```
project/
├── .github/
│   ├── copilot-instructions.md
│   └── workflows/
├── .husky/
├── docs/
│   └── architecture/decisions/    # ADRs
├── packages/                       # Monorepo packages
│   └── [package-name]/
│       ├── src/
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       └── test/
│           ├── unit/
│           └── integration/
├── features/                       # E2E BDD tests
│   ├── **/*.feature
│   ├── step_definitions/
│   └── support/
├── scripts/
│   ├── check-secrets.cjs
│   └── auto-release.js
└── [config files]
```

## Quick Reference Commands

```bash
# Development
npx wattpm dev                    # Start Watt in dev mode with hot-reload
npm run dev                       # Alternative: tsx watch
npm run test:watch                # Run tests in watch mode

# Testing patterns
npm run test:unit                 # Fast unit tests (~7s)
npm run test:integration          # Integration tests with Testcontainers (~6s)
npx cucumber-js --tags "@smoke"   # BDD smoke tests for CI
npm run test:cov                  # Coverage report (HTML)
npm test                          # Full suite: unit → integration → e2e

# Quality checks
npm run lint                      # Fix linting issues
npm run format                    # Format all files
npm run verify                    # Full verification before push

# Git workflow
git checkout -b feat/my-feature   # Create feature branch
git add -A && git commit -m "feat(scope): description"
gh pr create --fill               # Create PR
gh pr merge --squash --delete-branch

# Release
npm run release:suggest           # Preview next version
npm run release                   # Auto-release with semver

# Docker
docker build -t watt-app .        # Build multi-stage image
docker compose up                 # Local development with services
```

## Success Metrics

| Metric                   | Target       | Purpose                |
| ------------------------ | ------------ | ---------------------- |
| **Lead time**            | < 1 day      | Commit → Production    |
| **Deployment frequency** | Multiple/day | Continuous delivery    |
| **MTTR**                 | < 1 hour     | Recovery speed         |
| **Change failure rate**  | < 15%        | Deployment reliability |
| **Test coverage**        | > 70%        | Code quality           |
| **Cognitive complexity** | < 10         | Maintainability        |
| **Build time**           | < 5 min      | Fast feedback          |
| **Unit test time**       | < 30s        | Developer experience   |

---

**Remember**: The best code is often the code you don't write. Question every abstraction, every
layer, every line. Make the computer do the repetitive work (via AI or automation), but keep the
critical thinking for yourself.
