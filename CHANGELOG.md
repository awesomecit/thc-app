# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-12-27

### ✨ Features

- **gateway**: expose auth and db services via proxy ([b8810e0])
- **auth**: implement keycloak authentication service with TDD ([d2fdc25])
- **dashboard**: add dev credentials and keycloak integration ([03f2bb3])
- **test**: add integration tests with testcontainers and fix test infrastructure ([95efb0c])
- **gateway**: implement centralized error handler with sanitization ([465856c])
- **observability**: implement health endpoints, Pino logger, correlation ID ([c661b2a])

### 🐛 Bug Fixes

- **gateway**: load real plugins in integration tests ([d691843])
- **observability**: add observability stack and fix all lint errors ([f10e52e])
- **correlation-id**: wrap plugin with fastify-plugin for inject() compatibility ([ad0b4ea])
- **secrets**: scan all committed files, exclude only .env and docs ([c130b74])
- **db**: use SERIAL for auto-increment id in movies table ([966ed1f])
- **hooks**: ensure pre-push uses correct Node version from nvm ([8b2274b])

## [0.4.0] - 2025-12-14

### ✨ Features

- **testing**: add complete test scenarios documentation ([5bbb424])

### 🐛 Bug Fixes

- **docs**: correct release workflow typos ([afe9773])

## [0.3.0] - 2025-12-14

### ✨ Features

- **release**: add CHANGELOG and feature.json generation ([90cafee])

## [Unreleased]

### Added

- Initial project setup with Platformatic Watt v3.27.0
- Multi-application architecture with 7 services:
  - Gateway (thc-gateway) - Main entry point
  - Database application (thc-db) with SQLite
  - Generic service (thc-service)
  - PostgreSQL hooks (thc-pg-hooks)
  - RabbitMQ hooks (thc-rabbitmq-hooks)
  - Node.js application (thc-node)
  - AI Warp integration (thc-ai-wrap) with OpenAI, DeepSeek, Gemini
- Developer experience automation (EPIC-001):
  - Husky for git hooks management
  - lint-staged for incremental linting on commit
  - Prettier with prose wrap for consistent formatting
- Comprehensive documentation:
  - 8 core guides covering architecture, deployment, testing, AI-assisted development
  - Practical development guide with Git workflow and quality gates
  - Sprint planning roadmap with XP timebox methodology
  - BDD acceptance criteria for all tasks
- Project structure following hexagonal architecture principles
- Monorepo workspace configuration with npm workspaces

### Changed

- Project repositioned as domain-agnostic (healthcare as example use case)
- Gateway renamed from `thc` to `thc-gateway` for clarity

### Documentation

- README with prerequisites, dependencies verification for Linux
- CONTRIBUTING guide with development workflow and coding standards
- ROADMAP with complete sprint planning (EPIC-001 to EPIC-012)
- Architecture Decision Records (ADR) template
- BDD scenarios (Given-When-Then) for all roadmap tasks

## [0.1.0] - 2025-12-13

### Added

- Initial release
- Project scaffold and documentation foundation
- Platformatic Watt integration
- Quality automation tooling (Husky, Prettier, lint-staged)

---

## Version History

- `MAJOR.x.x` - Breaking changes (incompatible API changes)
- `x.MINOR.x` - New features (backward-compatible)
- `x.x.PATCH` - Bug fixes (backward-compatible)

## How to Read

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[unreleased]: https://github.com/awesomecit/thc-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/awesomecit/thc-app/releases/tag/v0.1.0
