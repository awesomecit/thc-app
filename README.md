# THC-App Documentation Repository

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)
[![Platformatic Watt](https://img.shields.io/badge/Platformatic-Watt-blue)](https://platformatic.dev)
[![Made with ❤️ for Healthcare](https://img.shields.io/badge/Made%20with%20%E2%9D%A4%EF%B8%8F%20for-Healthcare-red)]()

**Comprehensive documentation for building enterprise healthcare applications with Platformatic Watt**

[Documentation](#documentation) • [Philosophy](#core-philosophy) • [Getting Started](#getting-started) • [Contributing](#contributing)

</div>

---

## 📚 About This Repository

This repository contains **comprehensive, production-ready documentation** for building modern healthcare applications using Platformatic Watt, hexagonal architecture, and industry best practices. While contextualized for healthcare/clinical systems, the principles and patterns apply broadly to any enterprise application.

**This is a documentation repository, not a runnable codebase.** It serves as a complete knowledge base and reference guide for developers building scalable, maintainable applications.

### 🎯 What You'll Find Here

- 🏗️ **Architectural Patterns**: Hexagonal architecture, SOLID principles, Clean Architecture
- 🚀 **Platformatic Watt**: Complete guides for multi-app orchestration and modular monoliths
- 🧪 **Testing Strategies**: BDD with Cucumber/Gherkin, TDD workflows, test pyramid implementation
- 🔧 **DevOps & CI/CD**: Docker, Kubernetes, GitHub Actions, quality gates
- 🤖 **AI-Assisted Development**: Effective use of GitHub Copilot and AI tools with critical thinking
- 📊 **Practical Workflows**: Git trunk-based development, conventional commits, semantic versioning

---

## 🧭 Core Philosophy: The "Regola Zero" (Rule Zero)

**Before producing ANYTHING** (file, function, interface, component), stop and ask:

1. **Do I really need this?** (Not "might need", but "solves a real problem NOW")
2. **Why do I need this?** (Explain in one sentence)
3. **What are the trade-offs?** (Pros AND cons)
4. **What alternatives exist?** (Maybe it already exists, maybe simpler is better)

This filter applies to every decision—before accepting AI suggestions, before creating abstractions, before adding dependencies.

> *"The best code is often the code you don't write. Question every abstraction, every layer, every line."*

---

## 📖 Documentation

### Core Guides

| # | Document | Description | Key Topics |
|---|----------|-------------|------------|
| **01** | [Guida Completa Platformatic Watt](./docs/guides/01-guida-completa-platformatic-watt.md) | Complete Watt reference | Architecture, NestJS integration, Platformatic DB, configurations |
| **02** | [Principi Architetturali](./docs/guides/02-principi-architetturali-esagonale-solid.md) | Architectural foundations | Hexagonal architecture, SOLID/DRY/KISS/YAGNI, Clean Architecture, XP |
| **03** | [Cloud Deployment](./docs/guides/03-cloud-deployment-docker-k8s.md) | Production deployment | Docker multi-stage, Kubernetes, health checks, CI/CD pipelines |
| **04** | [AI-Assisted Development](./docs/guides/04-sviluppo-ai-assisted-copilot-claude.md) | Working with AI tools | Copilot best practices, anti-patterns, critical thinking |
| **05** | [BDD/TDD Workflow](./docs/guides/05-bdd-tdd-acceptance-criteria-workflow.md) | Test-driven development | Gherkin scenarios, TDD cycle, acceptance criteria |
| **06** | [Podcast Scalette](./docs/guides/06-podcast-scalette-4-episodi.md) | Educational content | Junior developer training materials |
| **07** | [Riflessione Etica AI](./docs/guides/07-riflessione-etica-ai-droga-digitale.md) | Critical AI analysis | AI as "digital drug", empirical evidence, balanced usage |
| **08** | [Modular Monolith Reference](./docs/guides/08-platformatic-modular-monolith-quick-reference.md) | Quick reference guide | DB applications, gateway composition, migrations, seeding |

### Practical Guides

- **[Development Practical Guide](./docs/guides/DEVELOPMENT_PRATICAL_GUIDE.md)**: Git workflow (trunk-based), quality gates (ESLint, Prettier, Husky), testing strategy (test pyramid), conventional commits, semantic versioning, setup checklists

### Examples

- **[EPIC-012: Admin Dashboard Telemetria](./docs/examples/EPIC-012-ADMIN-DASHBOARD-TELEMETRIA.md)**: Example feature epic with acceptance criteria

---

## 🚀 Getting Started

### For Learning

1. Start with **[01 - Guida Completa](./docs/guides/01-guida-completa-platformatic-watt.md)** for technical overview
2. Read **[02 - Principi Architetturali](./docs/guides/02-principi-architetturali-esagonale-solid.md)** for the mindset
3. Follow **[05 - BDD/TDD Workflow](./docs/guides/05-bdd-tdd-acceptance-criteria-workflow.md)** for development process
4. Review **[Practical Guide](./docs/guides/DEVELOPMENT_PRATICAL_GUIDE.md)** for hands-on practices

### For Project Setup

1. **Architecture**: [02 - Principi Architetturali](./docs/guides/02-principi-architetturali-esagonale-solid.md) + [08 - Modular Monolith](./docs/guides/08-platformatic-modular-monolith-quick-reference.md)
2. **Configuration**: [01 - Guida Completa Watt](./docs/guides/01-guida-completa-platformatic-watt.md)
3. **Testing**: [05 - BDD/TDD Workflow](./docs/guides/05-bdd-tdd-acceptance-criteria-workflow.md) + [Practical Guide](./docs/guides/DEVELOPMENT_PRATICAL_GUIDE.md) (Test Pyramid)
4. **Deployment**: [03 - Cloud Deployment](./docs/guides/03-cloud-deployment-docker-k8s.md)
5. **Quality Gates**: [Practical Guide](./docs/guides/DEVELOPMENT_PRATICAL_GUIDE.md) (Section 6)

### For AI-Assisted Development

Read **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Comprehensive AI agent instructions covering all documentation with practical workflows and commands.

---

## 🏗️ Architecture Highlights

### Platformatic Watt Multi-Application Pattern

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
    │       ├── domain/
    │       ├── application/
    │       └── infrastructure/
    └── frontend/          # Next.js or other frontend
        └── watt.json
```

### Hexagonal Architecture (Ports & Adapters)

- **Domain (Core)**: Business logic, entities, use cases—no external dependencies
- **Ports**: Interfaces defined by domain (e.g., `PatientRepository` interface)
- **Adapters**: Implementations of ports (e.g., `PostgresPatientRepository`, `HL7Adapter`)
- Each Watt application can represent a bounded context or adapter

### Test Pyramid

```
        /\
       /  \  E2E (10%) - Cucumber/Gherkin
      /────\
     /      \ Integration (20%) - Testcontainers
    /────────\
   /          \ Unit (70%) - Jest/Tap
  /────────────\
```

---

## 🛠️ Key Technologies

- **Runtime**: Node.js 22+
- **Framework**: [Platformatic Watt](https://platformatic.dev)
- **Backend**: NestJS (optional but recommended)
- **Database**: PostgreSQL + Platformatic DB
- **Testing**: Jest/Tap (unit), Testcontainers (integration), Cucumber (E2E)
- **Quality**: ESLint + SonarJS, Prettier, Husky, Commitlint
- **CI/CD**: GitHub Actions, Docker, Kubernetes

---

## 📊 Workflow & Best Practices

### Git Workflow: Trunk-Based Development

- **main** is always deployable (protected)
- Feature branches live **< 3 days**
- Commit early, push often
- No develop branch (YAGNI)

### Conventional Commits & Semantic Versioning

```bash
feat(scope): description     # → MINOR bump (1.0.0 → 1.1.0)
fix(scope): description      # → PATCH bump (1.0.0 → 1.0.1)
feat!: breaking change       # → MAJOR bump (1.0.0 → 2.0.0)
```

### Quality Gates (Pre-commit)

1. **lint-staged**: ESLint --fix on staged files
2. **Prettier**: Auto-format
3. **Secret scanning**: Prevent credential leaks
4. **Commitlint**: Validate commit message format

---

## 🎯 Success Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| **Lead time** | < 1 day | Commit → Production |
| **Deployment frequency** | Multiple/day | Continuous delivery |
| **MTTR** | < 1 hour | Recovery speed |
| **Change failure rate** | < 15% | Deployment reliability |
| **Test coverage** | > 70% | Code quality |
| **Cognitive complexity** | < 10 | Maintainability |
| **Build time** | < 5 min | Fast feedback |

---

## 🤝 Contributing

We welcome contributions! This documentation is a living resource that improves with community input.

### How to Contribute

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b docs/your-improvement`
3. Make your changes following the [Regola Zero](#core-philosophy)
4. **Commit** with conventional format: `docs(section): description`
5. **Push** and create a Pull Request

### Guidelines

- Keep examples **concrete** and **actionable**
- Preserve the **healthcare context** where present
- Maintain **consistency** across documents
- Update cross-references when moving content
- Follow the documentation structure and numbering

### What to Contribute

- ✅ Real-world examples from your projects
- ✅ Clarifications and corrections
- ✅ Additional patterns and anti-patterns
- ✅ New architectural decision records (ADRs)
- ✅ Translations (currently: Italian & English)
- ❌ Generic advice without context
- ❌ Vendor-specific recommendations
- ❌ Unverified patterns

---

## 📝 License

This documentation is released under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2025 Antonio Cittadino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

This documentation draws inspiration from:

- **Alistair Cockburn** - Hexagonal Architecture
- **Robert C. Martin (Uncle Bob)** - Clean Architecture, SOLID principles
- **Kent Beck** - Extreme Programming, TDD
- **Eric Evans** - Domain-Driven Design
- **Martin Fowler** - Refactoring, Continuous Integration
- **The Platformatic Team** - Watt framework and tooling

Special thanks to the healthcare development community for real-world insights and patterns.

---

## 📧 Contact & Community

- **Author**: Antonio Cittadino
- **Repository**: [github.com/yourusername/thc-app](https://github.com/yourusername/thc-app)
- **Issues**: Use GitHub Issues for questions, suggestions, and discussions

### Related Resources

- [Platformatic Documentation](https://docs.platformatic.dev)
- [Hexagonal Architecture Guide](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture Book](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)
- [Test-Driven Development by Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/)

---

<div align="center">

**⭐ If you find this documentation useful, please consider giving it a star! ⭐**

*Built with ❤️ for the developer community*

</div>
