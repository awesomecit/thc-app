# THC-App Documentation

Documentazione tecnica del progetto TicOps Health Check (THC).

## 📁 Struttura

```
docs/
├── README.md                           # Questa guida
├── INTEGRATION_ANALYSIS.md             # Sprint planning & gap analysis
├── RELEASE-SYSTEM-SUMMARY.md           # Release automation summary
├── STACK_AND_PORTS.md                  # Infrastructure ports & services
├── REQUIREMENTS.md                     # Project requirements
├── PRISMA_ENTITY_SCHEMA.md             # Database entity design
├── INTEGRATION_GUIDE_FRONTEND_WATT.md  # Frontend integration guide
├── VSCODE_INTEGRATION_GUIDE.md         # VSCode setup guide
├── XP_ROADMAP_FULLSTACK.md             # Extreme Programming roadmap
├── TICOPS.md                           # TICOPS project overview
├── TICOPS_COMPLETE_ROADMAP.md          # Complete TICOPS roadmap
├── TICOPS_IOT_DESIGN_DOCUMENT.md       # IoT design document
├── GAME_MODES_OVERVIEW.md              # Game modes documentation
├── architecture/
│   ├── decisions/                      # ADRs (Architecture Decision Records)
│   └── diagrams/                       # Architecture diagrams
└── guides/
    ├── 01-guida-completa-platformatic-watt.md
    ├── 02-principi-architetturali-esagonale-solid.md
    ├── 03-cloud-deployment-docker-k8s.md
    ├── 04-sviluppo-ai-assisted-copilot-claude.md
    ├── 05-bdd-tdd-acceptance-criteria-workflow.md
    ├── 08-platformatic-modular-monolith-quick-reference.md
    ├── 09-secrets-management-guide.md
    ├── 10-observability-design.md
    ├── 11-automatic-versioning-release-workflow.md
    ├── 12-http-caching-watt-guide.md
    ├── 13-platformatic-db-crud-generation-guide.md
    └── DEVELOPMENT_PRATICAL_GUIDE.md
```

## 🎯 Quick Access

### Getting Started

1. **Project Overview**: `/README.md` (root)
2. **Setup Guide**: `guides/DEVELOPMENT_PRATICAL_GUIDE.md`
3. **Infrastructure**: `STACK_AND_PORTS.md`

### Architecture & Design

- **Hexagonal Architecture**: `guides/02-principi-architetturali-esagonale-solid.md`
- **Platformatic Watt Guide**: `guides/01-guida-completa-platformatic-watt.md`
- **Database Schema**: `PRISMA_ENTITY_SCHEMA.md`
- **ADRs**: `architecture/decisions/`

### Development Workflow

- **BDD/TDD Workflow**: `guides/05-bdd-tdd-acceptance-criteria-workflow.md`
- **AI-Assisted Development**: `guides/04-sviluppo-ai-assisted-copilot-claude.md`
- **Sprint Planning**: `INTEGRATION_ANALYSIS.md`
- **XP Roadmap**: `XP_ROADMAP_FULLSTACK.md`

### Operations & Deployment

- **Docker & K8s**: `guides/03-cloud-deployment-docker-k8s.md`
- **Observability**: `guides/10-observability-design.md`
- **Secrets Management**: `guides/09-secrets-management-guide.md`
- **Release Workflow**: `guides/11-automatic-versioning-release-workflow.md`

### Platform Features

- **Modular Monolith**: `guides/08-platformatic-modular-monolith-quick-reference.md`
- **HTTP Caching**: `guides/12-http-caching-watt-guide.md`
- **CRUD Generation**: `guides/13-platformatic-db-crud-generation-guide.md`

### TICOPS Project

- **Overview**: `TICOPS.md`
- **Complete Roadmap**: `TICOPS_COMPLETE_ROADMAP.md`
- **IoT Design**: `TICOPS_IOT_DESIGN_DOCUMENT.md`
- **Game Modes**: `GAME_MODES_OVERVIEW.md`

## 🏗️ Project Principles

- **Hexagonal Architecture** (Ports & Adapters)
- **SOLID, DRY, KISS, YAGNI**
- **TDD/BDD** testing approach
- **Trunk-Based Development**
- **Conventional Commits**
- **AI-Assisted Development** with human oversight

## 📚 Essential Reading Order

1. `/README.md` - Project introduction
2. `guides/DEVELOPMENT_PRATICAL_GUIDE.md` - Practical setup
3. `STACK_AND_PORTS.md` - Infrastructure overview
4. `guides/02-principi-architetturali-esagonale-solid.md` - Architecture
5. `guides/05-bdd-tdd-acceptance-criteria-workflow.md` - Workflow
6. `INTEGRATION_ANALYSIS.md` - Current sprint
