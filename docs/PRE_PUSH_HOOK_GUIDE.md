# Pre-push Hook Configuration

## Overview

The pre-push hook runs quality checks **only when pushing to protected branches** (`main` or
`master`).

## What Gets Checked

When pushing to `main` or `master`:

1. 🏗️ **Build verification**: `npm run build` (compiles all TypeScript sub-apps)
2. 🧪 **Test suite**: `npm test` (unit + integration tests)

When pushing to feature branches:

- ⚡ **No checks** - fast workflow for development

## Bypass Mechanism

### When to Use

Use the skip flag **only** in emergencies:

- CI/CD is down and you need to push a critical hotfix
- You're pushing work-in-progress for collaboration
- Tests are flaky and blocking a time-sensitive release

⚠️ **Warning**: CI/CD will still verify your changes. Bypassing local checks doesn't bypass CI.

### How to Skip

```bash
# Skip all pre-push checks
SKIP_PRE_PUSH_CHECKS=true git push origin main

# Or set it temporarily in your shell
export SKIP_PRE_PUSH_CHECKS=true
git push origin main
unset SKIP_PRE_PUSH_CHECKS
```

### Recommended Workflow

```bash
# Normal push (triggers checks on main/master)
git push origin main
# → 🏗️ Build (20-30s)
# → 🧪 Tests (30-60s)
# → ✅ Push succeeds

# Feature branch (no checks)
git push origin feat/new-feature
# → ⚡ Instant push

# Emergency bypass (use sparingly)
SKIP_PRE_PUSH_CHECKS=true git push origin main
# → ⚠️ Warning shown
# → Push proceeds immediately
```

## Performance

- **Feature branches**: Instant push (~100ms)
- **Protected branches**:
  - Build: ~20-30 seconds (4 TypeScript apps)
  - Tests: ~30-60 seconds (unit + integration)
  - Total: ~1 minute
- **With bypass**: Instant push with warning

## CI/CD Integration

Even if you bypass local checks, GitHub Actions (or equivalent) will:

1. Run full build on all supported Node.js versions
2. Run complete test suite (unit + integration + e2e)
3. Check code quality (lint, format, secrets)
4. Block merge if any check fails

**The pre-push hook is a courtesy for fast feedback**, not a replacement for CI/CD.

## Troubleshooting

### Hook Not Running

```bash
# Check if hook is executable
ls -l .husky/pre-push

# Make it executable if needed
chmod +x .husky/pre-push
```

### Always Skipping Checks

```bash
# Check if SKIP_PRE_PUSH_CHECKS is set in your environment
echo $SKIP_PRE_PUSH_CHECKS

# Unset it
unset SKIP_PRE_PUSH_CHECKS
```

### Build/Tests Pass Locally but Fail in CI

This usually means:

- Environment-specific issue (Node.js version, missing env vars)
- Testcontainers not available in CI
- Different npm/package-lock.json versions

Check CI logs for specific errors.
