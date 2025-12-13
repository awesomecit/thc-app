# Documentation Structure

This directory contains all project documentation organized following software engineering best practices.

## Structure

```
docs/
├── architecture/          # Architecture documentation
│   ├── decisions/        # Architecture Decision Records (ADRs)
│   └── diagrams/         # Architecture diagrams
├── guides/               # Main documentation guides (01-08 + practical guide)
├── examples/             # Example implementations and EPICs
└── templates/            # Reusable templates for ADRs, EPICs, etc.
```

## Guides

Located in `guides/`:

- **01-08**: Core documentation guides (Watt, Architecture, Deployment, BDD/TDD, etc.)
- **DEVELOPMENT_PRATICAL_GUIDE.md**: Hands-on implementation practices

## Examples

Located in `examples/`:

- **EPIC-012-ADMIN-DASHBOARD-TELEMETRIA.md**: Example feature epic

## Architecture Decision Records (ADRs)

Located in `architecture/decisions/`:

Document significant architectural decisions using the ADR template in `templates/`.

### Naming Convention

```
YYYYMMDD-number-title.md
```

Example: `20251213-001-choose-platformatic-watt.md`

## Contributing

When adding documentation:

1. Apply **Regola Zero**: Do you really need this document?
2. Choose appropriate directory based on content type
3. Use templates when available
4. Update this index if adding new sections
5. Follow conventional commits for documentation changes

---

*Keep documentation lean, actionable, and pragmatic.*
