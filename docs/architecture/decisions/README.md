# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant architectural
decisions.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context
and consequences.

## When to Create an ADR

Create an ADR when making decisions about:

- Technology choices (frameworks, databases, languages)
- Architectural patterns (hexagonal, microservices, monolith)
- Integration approaches (APIs, messaging, events)
- Development practices that affect architecture
- Security or compliance requirements

**Apply Regola Zero**: Only create an ADR if the decision significantly impacts the system
architecture and future development.

## ADR Template

Use the template in `../templates/ADR-TEMPLATE.md`

## Naming Convention

```
YYYYMMDD-number-title.md
```

Examples:

- `20251213-001-choose-platformatic-watt.md`
- `20251213-002-adopt-hexagonal-architecture.md`
- `20251214-003-use-postgresql-for-persistence.md`

## ADR Process

1. **Draft**: Create ADR using template
2. **Propose**: Share for review
3. **Accept**: Decision approved and implemented
4. **Supersede**: If decision changes, create new ADR and mark old one as superseded

## Current ADRs

<!-- List ADRs here as they are created -->

_No ADRs yet. This project is documentation-focused._

---

## Resources

- [ADR GitHub Org](https://adr.github.io/)
- [Documenting Architecture Decisions - Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
