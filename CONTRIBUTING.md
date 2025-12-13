# Contributing to THC-App

Thank you for your interest in contributing to THC-App! This document provides guidelines and
instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## 🤝 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 22.19.0 (use `nvm use` to switch automatically)
- **npm** >= 10.0.0
- **Git** >= 2.30.0
- **Docker** >= 24.0.0 (for integration tests)

Verify your environment:

```bash
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x
git --version   # Should show 2.x.x
```

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/thc-app.git
   cd thc-app
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Set up git hooks** (automatically done by Husky):

   ```bash
   # Husky hooks are installed via npm install (prepare script)
   # Verify hooks are working:
   ls -la .husky/pre-commit
   ```

5. **Verify setup**:
   ```bash
   npm run lint      # Check code formatting
   npm run build     # Build all applications
   npm run dev       # Start development server
   ```

## 🔄 Development Workflow

We follow **Trunk-Based Development** with short-lived feature branches:

### 1. Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

**Branch naming conventions**:

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes
- `chore/description` - Tooling, dependencies

### 2. Make Your Changes

- Write code following our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation if needed
- Keep changes **focused and atomic**

### 3. Commit Your Changes

We use **Conventional Commits** format:

```bash
git add .
git commit -m "feat(scope): add new feature description"
```

**Commit types**:

- `feat:` - New feature (MINOR version bump)
- `fix:` - Bug fix (PATCH version bump)
- `docs:` - Documentation only
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Tooling, dependencies
- `feat!:` or `BREAKING CHANGE:` - Breaking change (MAJOR version bump)

**Examples**:

```bash
git commit -m "feat(gateway): add circuit breaker for API calls"
git commit -m "fix(db): prevent race condition in connection pool"
git commit -m "docs(readme): update installation instructions"
```

### 4. Push and Create Pull Request

```bash
git push -u origin feat/your-feature-name
```

Then create a Pull Request on GitHub.

## 📏 Coding Standards

### Regola Zero (Rule Zero)

Before writing ANY code, ask yourself:

1. **Do I really need this?** (Not "might need", but "solves a real problem NOW")
2. **Why do I need this?** (Explain in one sentence)
3. **What are the trade-offs?** (Pros AND cons)
4. **What alternatives exist?** (Maybe it already exists, maybe simpler is better)

### Code Quality Rules

- **Cognitive Complexity**: < 10 (enforced by SonarJS)
- **Cyclomatic Complexity**: < 10 (enforced by ESLint)
- **Test Coverage**: >= 70% (lines, functions, branches)
- **File Length**: Prefer < 300 lines per file
- **Function Length**: Prefer < 50 lines per function

### TypeScript Standards

- Use **strict mode** (`"strict": true` in tsconfig.json)
- Prefer **explicit types** over `any`
- Use **interfaces** for public APIs
- Use **types** for internal structures
- Follow **hexagonal architecture** principles:
  - Domain logic has no external dependencies
  - Use ports (interfaces) for all external interactions
  - Implement adapters for infrastructure

### Formatting

Code formatting is **automatic** via Prettier on commit:

- Runs on `git commit` via Husky pre-commit hook
- Formats TypeScript, JavaScript, JSON, Markdown, YAML
- Configuration in `.prettierrc`
- **Manual format**: `npm run format`

## 💬 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

- `feat` → MINOR version bump (1.0.0 → 1.1.0)
- `fix` → PATCH version bump (1.0.0 → 1.0.1)
- `feat!` or `BREAKING CHANGE:` → MAJOR version bump (1.0.0 → 2.0.0)
- `docs`, `style`, `refactor`, `test`, `chore` → No version bump

### Scope

Optional but recommended. Examples: `gateway`, `db`, `auth`, `docs`, `dx`

### Subject

- Use imperative mood: "add feature" not "added feature"
- Don't capitalize first letter
- No period at the end
- Keep it concise (< 50 characters)

### Body (Optional)

- Explain **what** and **why**, not how
- Wrap at 100 characters
- Separate from subject with blank line

### Footer (Optional)

- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

```bash
# Simple feature
feat(gateway): add rate limiting middleware

# Bug fix with body
fix(db): prevent connection leak in transaction rollback

Connection pool was exhausted due to unclosed connections when
transactions failed. Added explicit connection release in error handler.

Closes #456

# Breaking change
feat(auth)!: change token format to JWT

BREAKING CHANGE: Token format changed from opaque tokens to JWT.
Clients must update token validation logic.
```

## 🔀 Pull Request Process

### Before Submitting

1. ✅ Ensure all tests pass: `npm test`
2. ✅ Verify code is formatted: `npm run lint`
3. ✅ Update documentation if needed
4. ✅ Add tests for new functionality
5. ✅ Rebase on latest `main` if needed

### PR Title

Use the same format as commit messages:

```
feat(scope): add new feature description
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## How Has This Been Tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged
```

### Review Process

1. **Automated checks** must pass:
   - Linting (ESLint + Prettier)
   - Tests (unit + integration)
   - Build verification
2. **Code review** by at least one maintainer
3. **Approval** required before merge
4. **Squash and merge** to keep history clean

### After Merge

- Delete your feature branch
- Pull latest `main`
- Start next feature

## 🧪 Testing Requirements

### Test Pyramid

```
┌─────────────────────────────────────┐
│  E2E/BDD (~10%)                    │  Slow, high confidence
├─────────────────────────────────────┤
│  Integration Tests (~20%)          │  Medium speed
├─────────────────────────────────────┤
│  Unit Tests (~70%)                 │  Fast, focused
└─────────────────────────────────────┘
```

### Unit Tests (70%)

- Test domain logic and use cases
- Use in-memory fakes for ports
- Fast (<30s for full suite)
- Location: `**/*.spec.ts` or `**/*.test.ts`

```typescript
// Example unit test
describe('PatientService', () => {
  it('should create patient with valid data', () => {
    // Arrange
    const repository = new InMemoryPatientRepository();
    const service = new PatientService(repository);

    // Act
    const patient = service.createPatient({ name: 'John Doe' });

    // Assert
    expect(patient.name).toBe('John Doe');
  });
});
```

### Integration Tests (20%)

- Test adapters and infrastructure
- Use Testcontainers for real dependencies
- Location: `**/*.integration.spec.ts`

```typescript
// Example integration test
describe('PostgresPatientRepository', () => {
  it('should persist patient to database', async () => {
    const container = await new PostgreSqlContainer().start();
    const repository = new PostgresPatientRepository(container.getConnectionString());

    const patient = await repository.save({ name: 'John Doe' });

    expect(patient.id).toBeDefined();
  });
});
```

### E2E Tests (10%)

- Test complete user scenarios
- Use Cucumber/Gherkin
- Location: `features/**/*.feature`

```gherkin
# Example E2E test
Feature: User Authentication

  Scenario: Successful login
    Given I am a registered user
    When I log in with valid credentials
    Then I should receive an access token
    And I should be redirected to dashboard
```

### Running Tests

```bash
npm run test:unit           # Fast unit tests
npm run test:integration    # Integration tests with Testcontainers
npm run test:e2e            # Full E2E tests
npm run test:cov            # Coverage report
npm test                    # All tests
```

### Coverage Requirements

- **Minimum**: 70% for lines, functions, branches, statements
- **New code**: Should maintain or improve coverage
- **Critical paths**: Aim for 100% coverage

## 🐛 Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use issue template** for bug reports
3. **Provide**:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS)
   - Code samples or screenshots

## 💡 Suggesting Features

1. **Check roadmap** in `ROADMAP.md`
2. **Open discussion** before major features
3. **Use issue template** for feature requests
4. **Provide**:
   - Use case and motivation
   - Proposed solution
   - Alternatives considered
   - Impact assessment

## 📚 Documentation

- **Code comments**: Explain "why", not "what"
- **README updates**: For user-facing changes
- **ADRs**: For architectural decisions (`docs/architecture/decisions/`)
- **API docs**: For public interfaces
- **Examples**: For complex features

## 🏆 Recognition

Contributors will be recognized in:

- `CHANGELOG.md` for each release
- GitHub contributors page
- Project README

## ❓ Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and features
- **Email**: For security concerns (see SECURITY.md)

---

**Thank you for contributing to THC-App!** 🎉

Your contributions help make this project better for everyone.
