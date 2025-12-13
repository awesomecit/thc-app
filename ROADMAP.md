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
  - **Task 1.1.1**: Install and configure Husky [4h]
    ```gherkin
    Given a developer working on the project
    When they run "npm install"
    Then Husky should be installed and .husky/ directory created
    And pre-commit hook should be executable
    And running "git commit" should trigger the hook
    ```
  - **Task 1.1.2**: Setup lint-staged for incremental linting [2h]
    ```gherkin
    Given Husky is configured
    When a developer stages files with "git add"
    Then lint-staged should run only on staged files
    And ESLint --fix should be applied to .ts/.js files
    And the process should complete in <10 seconds for typical changes
    ```
  - **Task 1.1.3**: Configure Prettier with prose wrap for docs [2h]
    ```gherkin
    Given lint-staged is configured
    When a developer stages any file
    Then Prettier should format the file automatically
    And markdown files should wrap at 100 characters
    And formatting should not break code blocks
    ```
  - **Task 1.1.4**: Create secret scanning script [4h] ✅
    ```gherkin
    Given a developer attempts to commit code
    When the pre-commit hook runs
    Then the secret scanner should check for AWS keys, API tokens, passwords
    And commits with secrets should be rejected with helpful error message
    And false positives can be bypassed with documented process
    ```
    **Implementation**: Integrated `secretlint` with `@secretlint/secretlint-rule-preset-recommend`.
    Detects GitHub tokens, AWS keys, database connection strings, private keys. Configuration:
    `.secretlintrc.json`, `.secretsignore`, `.secretsafe`

- **Story 1.2**: Commit Validation
  - **Task 1.2.1**: Install commitlint with conventional config [2h]
    ```gherkin
    Given a project following conventional commits
    When commitlint is installed
    Then @commitlint/config-conventional should be configured
    And the commit-msg hook should validate message format
    ```
  - **Task 1.2.2**: Configure commit-msg hook [2h]
    ```gherkin
    Given commitlint is installed
    When a developer commits with message "invalid message"
    Then the commit should be rejected
    And an error message should explain the correct format
    When they commit with "feat(scope): valid message"
    Then the commit should succeed
    ```
  - **Task 1.2.3**: Document commit message examples [2h]
    ```gherkin
    Given conventional commits are enforced
    When a developer reads COMMIT_CONVENTIONS.md
    Then they should see examples for feat, fix, docs, style, refactor, test, chore
    And each example should show scope usage and breaking changes
    And the document should link to commitlint.config.cjs
    ```

#### Sprint 2: Advanced Automation

- **Story 2.1**: Code Quality Enforcement
  - **Task 2.1.1**: Configure ESLint with SonarJS plugin [4h]
    ```gherkin
    Given a TypeScript project
    When ESLint is configured with typescript-eslint and eslint-plugin-sonarjs
    Then running "npm run lint" should check all .ts files
    And SonarJS rules should be active (cognitive-complexity, no-duplicate-string, etc.)
    And lint errors should fail the pre-commit hook
    ```
  - **Task 2.1.2**: Set complexity limits (cognitive <10, cyclomatic <10) [2h]
    ```gherkin
    Given ESLint with SonarJS is configured
    When a developer writes a function with cognitive complexity > 10
    Then ESLint should report an error
    And the error message should suggest refactoring strategies
    When complexity is <= 10
    Then no error should be raised
    ```
  - **Task 2.1.3**: Add pre-push hooks for build verification [2h]
    ```gherkin
    Given TypeScript project with build step
    When a developer runs "git push"
    Then the pre-push hook should run "npm run build"
    And if build fails, push should be prevented
    And the developer should see compilation errors
    ```

- **Story 2.2**: Semantic Versioning Automation
  - **Task 2.2.1**: Create auto-release script based on commits [6h]
    ```gherkin
    Given a repository with conventional commits
    When the auto-release script runs
    Then it should analyze commits since last tag
    And feat commits should trigger MINOR version bump
    And fix commits should trigger PATCH version bump
    And BREAKING CHANGE should trigger MAJOR version bump
    And a new git tag should be created (e.g., v1.2.3)
    ```
  - **Task 2.2.2**: Configure CHANGELOG generation [2h]
    ```gherkin
    Given auto-release script calculates new version
    When CHANGELOG.md is generated
    Then it should group commits by type (Features, Bug Fixes, etc.)
    And each entry should link to commit hash
    And BREAKING CHANGES should be prominently displayed
    And the file should follow Keep a Changelog format
    ```
  - **Task 2.2.3**: Document release workflow [2h]
    ```gherkin
    Given semantic release is configured
    When a developer reads RELEASE_PROCESS.md
    Then they should understand how commits affect versioning
    And they should see examples of release commands
    And emergency manual release process should be documented
    And rollback procedures should be explained
    ```

---

### EPIC-002: Documentation as Code Infrastructure

**Goal**: Treat documentation with same rigor as production code  
**Team**: 1 developer  
**Estimated Sprints**: 1

#### Sprint 3: Documentation Pipeline

- **Story 3.1**: Validation & Formatting
  - **Task 3.1.1**: Add markdown linting rules [2h]
    ```gherkin
    Given documentation files in docs/ directory
    When markdownlint is configured
    Then running "npm run lint:docs" should check all .md files
    And rules should enforce consistent heading structure
    And line length should be limited to 100 characters for prose
    And code blocks should be properly fenced
    ```
  - **Task 3.1.2**: Configure automated link checking [4h]
    ```gherkin
    Given markdown files with internal and external links
    When link checker runs in CI pipeline
    Then all internal links should be validated (./docs/...)
    And broken links should fail the build
    And external links should be checked with warnings (not failures)
    And a report should list all broken links
    ```
  - **Task 3.1.3**: Setup documentation build pipeline [4h]
    ```gherkin
    Given documentation source files
    When CI/CD pipeline runs
    Then markdown should be validated
    And links should be checked
    And a static site should be generated (optional)
    And build artifacts should be deployable
    ```

- **Story 3.2**: ADR Workflow
  - **Task 3.2.1**: Create first ADR for platform choice [2h]
    ```gherkin
    Given the ADR template exists
    When the first ADR is created for "Why Platformatic Watt?"
    Then it should use ADR-001 numbering
    And it should include context, decision, consequences, alternatives
    And it should be stored in docs/architecture/decisions/
    And status should be "Accepted"
    ```
  - **Task 3.2.2**: Add ADR validation script [4h]
    ```gherkin
    Given ADR files in docs/architecture/decisions/
    When validation script runs
    Then it should check ADR numbering is sequential
    And required sections should be present (Context, Decision, Consequences)
    And ADR filename should match format ADR-NNN-title.md
    And validation should fail if structure is incorrect
    ```
  - **Task 3.2.3**: Document ADR creation workflow [2h]
    ```gherkin
    Given developers need to document architectural decisions
    When they read docs/architecture/decisions/README.md
    Then they should understand when to create an ADR
    And they should see step-by-step creation process
    And examples of good ADRs should be provided
    And template location should be documented
    ```

---

### EPIC-003: Testing Infrastructure Foundation

**Goal**: Establish testing pyramid and BDD framework  
**Team**: 1-2 developers  
**Estimated Sprints**: 2

#### Sprint 4: Unit Test Setup

- **Story 4.1**: Jest Configuration
  - **Task 4.1.1**: Install and configure Jest for unit tests [4h]
    ```gherkin
    Given a TypeScript project
    When Jest is installed with ts-jest
    Then running "npm run test:unit" should execute all *.spec.ts files
    And tests should run in <30 seconds
    And test output should be clear and readable
    And jest.config.cjs should exclude integration tests
    ```
  - **Task 4.1.2**: Setup coverage thresholds (70%) [2h]
    ```gherkin
    Given Jest is configured
    When coverage thresholds are set to 70%
    Then running "npm run test:cov" should generate HTML report
    And builds should fail if coverage drops below 70% for lines, functions, branches, statements
    And coverage report should be gitignored
    And CI should enforce coverage requirements
    ```
  - **Task 4.1.3**: Create example unit test suite [4h]
    ```gherkin
    Given Jest is configured with coverage
    When example domain logic is tested
    Then tests should follow AAA pattern (Arrange-Act-Assert)
    And each test should have descriptive "it('should...')" format
    And test file should be named *.spec.ts
    And mocks should use in-memory fakes, not complex mocking libraries
    ```

- **Story 4.2**: Test Utilities
  - **Task 4.2.1**: Create in-memory test adapters [6h]
    ```gherkin
    Given hexagonal architecture with port interfaces
    When in-memory adapters are created for testing
    Then InMemoryPatientRepository should implement PatientRepository interface
    And data should be stored in Map or array
    And adapters should support CRUD operations
    And adapters should be easily resettable between tests
    ```
  - **Task 4.2.2**: Setup test data factories [4h]
    ```gherkin
    Given tests requiring domain entities
    When test data factories are created
    Then createPatient() should return valid Patient entity
    And factories should use sensible defaults
    And specific values should be overridable
    And factories should be reusable across test suites
    ```
  - **Task 4.2.3**: Document testing patterns [2h]
    ```gherkin
    Given unit testing infrastructure is established
    When developers read docs/guides/TESTING.md
    Then they should see examples of AAA pattern
    And in-memory adapter usage should be demonstrated
    And test factory patterns should be explained
    And common pitfalls should be documented
    ```

#### Sprint 5: Integration & E2E Tests

- **Story 5.1**: Testcontainers Setup
  - **Task 5.1.1**: Configure Testcontainers for Postgres [4h]
    ```gherkin
    Given integration tests require a real database
    When Testcontainers is configured for Postgres
    Then running "npm run test:integration" should start a Postgres container
    And the container should be destroyed after tests complete
    And connection string should be automatically configured
    And tests should run in isolation without affecting other databases
    ```
  - **Task 5.1.2**: Configure Testcontainers for Redis [2h]
    ```gherkin
    Given integration tests require Redis for caching
    When Testcontainers is configured for Redis
    Then a Redis container should start before tests
    And cache operations should work in tests
    And the container should be cleaned up automatically
    And Redis port should be dynamically assigned
    ```
  - **Task 5.1.3**: Create integration test examples [6h]
    ```gherkin
    Given Testcontainers is configured
    When integration tests are created for PatientRepository
    Then tests should use real Postgres container
    And database schema should be migrated before tests
    And CRUD operations should be tested end-to-end
    And test files should be named *.integration.spec.ts
    ```

- **Story 5.2**: BDD with Cucumber
  - **Task 5.2.1**: Install and configure Cucumber [4h]
    ```gherkin
    Given BDD approach is adopted
    When Cucumber is installed with @cucumber/cucumber
    Then running "npm run test:e2e" should execute .feature files
    And cucumber.js config should define step definition paths
    And tests should support tags for filtering (@smoke, @security, etc.)
    And JSON report should be generated for client visibility
    ```
  - **Task 5.2.2**: Create feature file template [2h]
    ```gherkin
    Given developers need to write BDD scenarios
    When a feature file template is created
    Then it should include Feature, Background, Scenario structure
    And Given-When-Then steps should be clearly separated
    And examples of tags should be provided (@smoke, @slow)
    And template should be in features/template.feature
    ```
  - **Task 5.2.3**: Implement first step definitions [6h]
    ```gherkin
    Given a feature file for user authentication exists
    When step definitions are implemented in step_definitions/
    Then "Given I am a registered user" should create test user
    And "When I log in with valid credentials" should call auth API
    And "Then I should receive an access token" should verify response
    And World context should be shared across steps
    ```

---

### EPIC-004: CI/CD Pipeline

**Goal**: Automate build, test, and deployment  
**Team**: 1 developer  
**Estimated Sprints**: 1

#### Sprint 6: GitHub Actions Setup

- **Story 6.1**: Basic Pipeline
  - **Task 6.1.1**: Create test workflow (unit + integration) [4h]
    ```gherkin
    Given a GitHub repository with tests
    When .github/workflows/test.yml is created
    Then workflow should trigger on push and pull_request to main
    And it should run "npm run test:unit" first
    And it should run "npm run test:integration" if unit tests pass
    And Node.js 22.19.0 should be used via setup-node action
    ```
  - **Task 6.1.2**: Add linting and formatting checks [2h]
    ```gherkin
    Given CI pipeline exists
    When linting jobs are added
    Then "npm run lint:check" should run before tests
    And "npm run format:check" should verify Prettier formatting
    And builds should fail if linting or formatting errors exist
    And error output should be visible in GitHub Actions UI
    ```
  - **Task 6.1.3**: Configure coverage reporting [2h]
    ```gherkin
    Given test workflow runs successfully
    When coverage reporting is configured
    Then coverage should be uploaded to Codecov or similar
    And PR comments should show coverage diff
    And coverage badge should be added to README
    And minimum 70% coverage should be enforced
    ```

- **Story 6.2**: Deployment Automation
  - **Task 6.2.1**: Create Docker build workflow [4h]
    ```gherkin
    Given a Dockerfile exists in the repository
    When .github/workflows/docker.yml is created
    Then workflow should trigger on tags (v*.*.*)
    And multi-stage build should be executed
    And image should be pushed to GitHub Container Registry
    And image tags should include version and latest
    ```
  - **Task 6.2.2**: Add semantic release automation [4h]
    ```gherkin
    Given conventional commits are used
    When semantic-release GitHub Action is configured
    Then it should run after successful tests on main branch
    And new version should be calculated from commits
    And git tag should be created automatically
    And CHANGELOG.md should be updated and committed
    And GitHub Release should be created with notes
    ```
  - **Task 6.2.3**: Document deployment process [2h]
    ```gherkin
    Given CI/CD pipelines are operational
    When developers read DEPLOYMENT.md
    Then they should understand the full pipeline flow
    And manual deployment process should be documented for emergencies
    And rollback procedures should be explained
    And secrets configuration (GITHUB_TOKEN, etc.) should be documented
    ```

---

### EPIC-012: Admin Dashboard Telemetria

**Goal**: Monitoring dashboard for system health and metrics  
**Team**: 1-2 developers  
**Estimated Sprints**: 3  
**Status**: Detailed spec in `docs/examples/EPIC-012-ADMIN-DASHBOARD-TELEMETRIA.md`

#### Sprint 7: Backend - Metrics Collection

- **Story 12.1**: Prometheus Integration
  - **Task 12.1.1**: Install prom-client and configure registry [2h]
    ```gherkin
    Given a NestJS backend application
    When prom-client is installed
    Then a Prometheus registry should be created
    And default metrics should be enabled (CPU, memory, event loop)
    And metrics should be accessible programmatically
    ```
  - **Task 12.1.2**: Create metrics service with counters/gauges [4h]
    ```gherkin
    Given Prometheus registry is configured
    When MetricsService is created
    Then it should expose methods like incrementCounter(name, value)
    And it should support gauges for current values (e.g., active connections)
    And metrics should be injectable via DI
    And service should be documented with usage examples
    ```
  - **Task 12.1.3**: Add HTTP request duration histogram [4h]
    ```gherkin
    Given MetricsService exists
    When HTTP request interceptor is created
    Then it should measure request duration in milliseconds
    And histogram should use buckets [0.1, 0.5, 1, 2, 5, 10] seconds
    And metrics should include method (GET/POST) and status code labels
    And P50, P95, P99 should be calculable from histogram
    ```
  - **Task 12.1.4**: Expose /metrics endpoint [2h]
    ```gherkin
    Given metrics are collected
    When GET /metrics is called
    Then it should return Prometheus text format
    And Content-Type should be text/plain
    And response should include all registered metrics
    And endpoint should be accessible without authentication
    ```

- **Story 12.2**: Health Check Endpoints
  - **Task 12.2.1**: Implement /health/live (liveness) [2h]
    ```gherkin
    Given an application running in Kubernetes
    When GET /health/live is called
    Then it should return 200 OK if process is alive
    And response should be {"status": "ok"}
    And it should NOT check external dependencies
    And response time should be <50ms
    ```
  - **Task 12.2.2**: Implement /health/ready (readiness) [4h]
    ```gherkin
    Given an application with dependencies
    When GET /health/ready is called
    Then it should check database connectivity
    And it should check cache connectivity (Redis)
    And it should return 200 OK only if all critical dependencies are healthy
    And response should include details: {"status": "ok", "checks": {...}}
    ```
  - **Task 12.2.3**: Add dependency health checks (DB, Redis) [4h]
    ```gherkin
    Given readiness endpoint exists
    When database health is checked
    Then it should execute a simple SELECT 1 query
    And timeout should be 3 seconds
    When Redis health is checked
    Then it should execute PING command
    And timeout should be 2 seconds
    And failures should be logged with details
    ```

#### Sprint 8: Backend - Data Persistence

- **Story 12.3**: Telemetry Data Storage
  - **Task 12.3.1**: Design telemetry schema (Postgres) [4h]
    ```gherkin
    Given need to persist metrics over time
    When telemetry schema is designed
    Then it should include table "telemetry_events" with columns: id, timestamp, metric_name, metric_value, labels (JSONB)
    And indexes should be created on timestamp and metric_name
    And schema should support time-series queries efficiently
    And retention policy should be documented (e.g., 90 days)
    ```
  - **Task 12.3.2**: Create migration scripts [2h]
    ```gherkin
    Given Platformatic DB is used
    When migration is created
    Then migrations/001.do.sql should create telemetry_events table
    And migrations/001.undo.sql should drop table
    And migration should be idempotent
    And running "npx platformatic db migrate" should apply migration
    ```
  - **Task 12.3.3**: Implement telemetry repository [6h]
    ```gherkin
    Given telemetry schema exists
    When TelemetryRepository is implemented
    Then save(event) should insert telemetry event
    And findByMetricName(name, from, to) should return time-series data
    And findSummary() should return aggregated stats
    And repository should use port interface for testability
    ```

- **Story 12.4**: API Endpoints
  - **Task 12.4.1**: GET /api/metrics/summary endpoint [4h]
    ```gherkin
    Given telemetry data is stored
    When GET /api/metrics/summary is called
    Then it should return total requests, average response time, error rate
    And response should be JSON: {"requests": 1234, "avgDuration": 123, "errorRate": 0.02}
    And endpoint should support date range query params
    And response time should be <500ms
    ```
  - **Task 12.4.2**: GET /api/metrics/timeseries endpoint [4h]
    ```gherkin
    Given telemetry repository exists
    When GET /api/metrics/timeseries?metric=http_requests&from=2024-01-01&to=2024-01-07 is called
    Then it should return array of {timestamp, value} objects
    And data should be grouped by hour or day based on range
    And response should support multiple metrics in single request
    And maximum 10000 data points per response
    ```
  - **Task 12.4.3**: Add filtering and pagination [4h]
    ```gherkin
    Given timeseries endpoint returns large datasets
    When pagination parameters are added (page, limit)
    Then response should include only requested page
    And response should include pagination metadata: {page, limit, total, totalPages}
    And default limit should be 100, max 1000
    And cursor-based pagination should be considered for performance
    ```

#### Sprint 9: Frontend - Dashboard UI

- **Story 12.5**: Dashboard Layout
  - **Task 12.5.1**: Setup Next.js app in Watt structure [4h]
    ```gherkin
    Given Platformatic Watt gateway is configured
    When Next.js application is created in web/dashboard/
    Then watt.json should configure basePath
    And gateway should proxy /dashboard/* to Next.js app
    And app should be accessible at http://localhost:3042/dashboard
    And hot-reload should work in development mode
    ```
  - **Task 12.5.2**: Create dashboard shell with navigation [4h]
    ```gherkin
    Given Next.js app is configured
    When dashboard shell is created
    Then it should include header with logo and navigation
    And sidebar should list sections: Overview, Metrics, Health
    And layout should be consistent across all pages
    And navigation should highlight current active section
    ```
  - **Task 12.5.3**: Implement responsive grid layout [4h]
    ```gherkin
    Given dashboard shell exists
    When responsive grid is implemented
    Then layout should adapt to mobile (1 column), tablet (2 columns), desktop (3 columns)
    And CSS Grid or Flexbox should be used
    And cards should stack vertically on mobile
    And breakpoints should be at 768px and 1024px
    ```

- **Story 12.6**: Metrics Visualization
  - **Task 12.6.1**: Integrate Chart.js for time series [4h]
    ```gherkin
    Given metrics timeseries API is available
    When Chart.js is integrated
    Then line charts should display request count over time
    And charts should be responsive
    And tooltips should show exact values on hover
    And chart colors should match design system
    ```
  - **Task 12.6.2**: Create metrics cards (uptime, requests, errors) [6h]
    ```gherkin
    Given metrics summary API is available
    When metrics cards are created
    Then "Uptime" card should show 99.9% with green indicator
    And "Total Requests" card should show 1.2M with trend arrow
    And "Error Rate" card should show 0.02% with red/green status
    And cards should fetch data from /api/metrics/summary
    And loading states should be displayed during fetch
    ```
  - **Task 12.6.3**: Add real-time WebSocket updates [6h]
    ```gherkin
    Given dashboard displays metrics
    When WebSocket connection is established
    Then metrics should update every 5 seconds without page refresh
    And connection should auto-reconnect on failure
    And connection status indicator should be visible
    And old data should be gracefully transitioned (fade-in animation)
    ```

---

### EPIC-005: Platformatic Watt Multi-App Structure

**Goal**: Implement modular monolith architecture  
**Team**: 1-2 developers  
**Estimated Sprints**: 2

#### Sprint 10: Gateway & Core Services

- **Story 5.1**: Gateway Setup
  - **Task 5.1.1**: Create gateway application with routing [4h]
    ```gherkin
    Given Platformatic Watt project structure
    When gateway application is created
    Then platformatic.json should define service routing
    And gateway should start on port 3042
    And health check should be accessible at /health
    And gateway should log all incoming requests
    ```

#### Sprint 11: Supporting Services

- **Story 5.3**: Telemetry Service
  - **Task 5.3.1**: Move telemetry logic to dedicated service [4h]
    ```gherkin
    Given telemetry code exists in main application
    When telemetry-service is extracted
    Then it should be a separate NestJS app in web/telemetry/
    And /api/telemetry/metrics should return metrics data
    And service should own telemetry database schema
    And existing functionality should remain unchanged
    ```
  - **Task 5.3.2**: Configure inter-service communication [4h]
    ```gherkin
    Given multiple services in Watt structure
    When service-to-service communication is needed
    Then services should use http://<service-id>.plt.local URLs
    And auth-service should call http://telemetry-service.plt.local/log
    And retry logic should be implemented for transient failures
    And circuit breaker pattern should be considered for resilience
    ```
  - **Task 5.3.3**: Add service discovery patterns [4h]
    ```gherkin
    Given services need to discover each other
    When service discovery is implemented
    Then services should read WATT_SERVICE_MAP from environment
    And health checks should verify dependent services
    And startup should fail gracefully if dependencies are unavailable
    And service URLs should be configurable per environment
    ```

- **Story 5.4**: Integration & Documentation
  - **Task 5.4.1**: Test full gateway routing [4h]
    ```gherkin
    Given all services are deployed in Watt
    When E2E tests are run
    Then request to /api/auth/login should reach auth-service
    And request to /dashboard should reach Next.js frontend
    And request to /api/telemetry/metrics should reach telemetry-service
    And /metrics (Prometheus) should aggregate metrics from all services
    ```
  - **Task 5.4.2**: Document service URLs and contracts [2h]
    ```gherkin
    Given multiple services with APIs
    When SERVICE_CONTRACTS.md is created
    Then each service should document its base URL
    And all endpoints should list method, path, request/response schemas
    And authentication requirements should be specified
    And examples should be provided with curl commands
    ```
  - **Task 5.4.3**: Create architecture diagram [2h]
    ```gherkin
    Given modular monolith is implemented
    When architecture diagram is created
    Then it should show gateway, auth-service, telemetry-service, dashboard
    And internal routing (.plt.local) should be illustrated
    And external dependencies (Postgres, Redis, Keycloak) should be shown
    And diagram should be in docs/architecture/diagrams/
    ```
  - **Task 5.1.3**: Add CORS and security headers [2h]
    ```gherkin
    Given gateway handles public traffic
    When CORS is configured
    Then preflight OPTIONS requests should be handled
    And Access-Control-Allow-Origin should be configurable via env
    When security headers are added
    Then X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security should be set
    And CSP header should be configured for production
    ```

- **Story 5.2**: Auth Service (NestJS)
  - **Task 5.2.1**: Create auth-service with NestJS [6h]
    ```gherkin
    Given modular monolith architecture
    When auth-service is created in web/auth/
    Then watt.json should export create() function (not bootstrap())
    And service should be accessible via gateway at /api/auth
    And /api/auth/health should return service status
    And service should use port 3043 internally
    ```
  - **Task 5.2.2**: Implement Keycloak adapter [6h]
    ```gherkin
    Given Keycloak is running via Docker Compose
    When Keycloak adapter is implemented
    Then POST /api/auth/login should exchange credentials for Keycloak token
    And token validation should verify signature and expiry
    And RBAC should map Keycloak roles to application permissions
    And refresh token flow should be supported
    ```
  - **Task 5.2.3**: Add session management with Redis [4h]
    ```gherkin
    Given auth-service handles authentication
    When Redis session store is configured
    Then successful login should create session in Redis with TTL
    And session key should be user:{userId}:session
    And logout should delete session from Redis
    And expired sessions should be automatically cleaned up
    ```

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
| ------- | ----------- | -------- | ------ | ------ | -------- |
| X.X.X   | Task name   | Xh       | Xh     | TODO   | Name     |

**Velocity**: X tasks completed / Y tasks planned = Z%  
**Blockers**: [List any impediments]  
**Notes**: [Sprint retrospective findings]

---

## 📈 Velocity History

| Sprint | Planned Tasks | Completed Tasks | Velocity | Completion Rate |
| ------ | ------------- | --------------- | -------- | --------------- |
| 1      | 8             | TBD             | TBD      | TBD             |
| 2      | 8             | TBD             | TBD      | TBD             |

**Target Velocity**: 6-8 tasks per developer per sprint  
**Current Average**: TBD (after 3 sprints)

---

## 🎯 Success Metrics

| Metric                  | Target  | Current | Status |
| ----------------------- | ------- | ------- | ------ |
| Sprint Completion Rate  | >80%    | TBD     | 🟡     |
| Lead Time (Task → Done) | <3 days | TBD     | 🟡     |
| Bugs in Production      | <5%     | TBD     | 🟡     |
| Code Coverage           | >70%    | TBD     | 🟡     |
| Build Time              | <5 min  | TBD     | 🟡     |

---

**Last Updated**: 2025-12-13  
**Next Review**: End of Sprint 1
