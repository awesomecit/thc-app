# Bug Report: SQLite ESM Import Issue in @platformatic/sql-mapper

## Summary

`@platformatic/sql-mapper` v3.27.0 has an ES module import issue with `@matteo.collina/sqlite-pool` where the default export is an **object containing multiple exports** (not a function), causing "sqlite.default is not a function" error.

## UPDATED FINDING (2024-12-14)

After deeper investigation, we discovered that `@matteo.collina/sqlite-pool@0.6.0` exports its default as an **object** containing:
- `createConnectionPool` (function) - accessible via `.default` property
- `sql` (template tag function)
- `isSqlQuery` (utility)

```javascript
// Actual structure of default export:
{
  sql: [Function: query],
  isSqlQuery: [Getter],
  createConnectionPool: [Function: createConnectionPool],
  default: [Function: createConnectionPool]  // Reference to createConnectionPool
}
```

Therefore, the **current Platformatic code is actually CORRECT** - it needs `sqlite.default()` to access the createConnectionPool function.

## Environment

- **Package**: `@platformatic/sql-mapper@3.27.0`
- **Node.js**: v22.19.0
- **Module System**: ESM (type: "module")
- **Test Runner**: Node.js built-in test runner with `tsx` loader
- **Dependency**: `@matteo.collina/sqlite-pool@0.6.0`

## Bug Location

**File**: `node_modules/@platformatic/sql-mapper/index.js`  
**Line**: 129

```javascript
// Current BROKEN code (line 127-129)
const { default: sqlite } = await import('@matteo.collina/sqlite-pool')
const path = connectionString.replace('sqlite://', '')
db = sqlite.default(  // ❌ BUG: sqlite is ALREADY the default export!
  connectionString === 'sqlite://:memory:' ? undefined : path,
  {},
  {
    maxSize: 1,
    // ...
```

## Root Cause Analysis

### The Problem

When using ES module dynamic import with destructuring:

```javascript
const { default: sqlite } = await import('@matteo.collina/sqlite-pool')
```

The variable `sqlite` **already contains** the default export. Accessing `sqlite.default` tries to call a non-existent property.

### Why This Happens

ES module imports have two patterns:

#### ✅ Pattern 1: Destructure default (current usage)

```javascript
const { default: sqlite } = await import('module')
// sqlite is now the default export directly
sqlite() // ✅ CORRECT
sqlite.default() // ❌ WRONG - undefined is not a function
```

#### ✅ Pattern 2: Import namespace then access default

```javascript
const sqlite = await import('module')
// sqlite is the module namespace
sqlite.default() // ✅ CORRECT
```

Platformatic mixes both patterns incorrectly.

## Expected Behavior

The code should call `sqlite()` directly after destructuring the default export.

## Actual Behavior

Error: `TypeError: sqlite.default is not a function`

This prevents:

- Running Platformatic DB tests with SQLite
- Using SQLite with ESM-native environments
- Integration testing with node:test + tsx

## Reproduction Steps

1. Create a Platformatic DB app with SQLite:

```bash
npm init @platformatic/db
# Choose SQLite as database
```

2. Configure as ESM project (`package.json`):

```json
{
  "type": "module"
}
```

3. Create test file using `@platformatic/db` API:

```typescript
// test/helper.ts
import { create } from '@platformatic/db'

export async function getServer() {
  const config = {
    db: {
      connectionString: 'sqlite://test.db'
    },
    migrations: {
      autoApply: true
    }
  }
  
  const server = await create('./', config)
  await server.start({})
  return server
}
```

4. Run test:

```bash
NODE_OPTIONS='--import tsx' node --test test/helper.test.ts
```

5. **Result**: `TypeError: sqlite.default is not a function`

## Proposed Fix

**File**: `@platformatic/sql-mapper/index.js` (or source `.ts`)  
**Line**: ~129

### Option A: Keep destructuring, remove `.default` access

```diff
  const { default: sqlite } = await import('@matteo.collina/sqlite-pool')
  const path = connectionString.replace('sqlite://', '')
- db = sqlite.default(
+ db = sqlite(
    connectionString === 'sqlite://:memory:' ? undefined : path,
    {},
    {
```

### Option B: Import namespace, use `.default` access

```diff
- const { default: sqlite } = await import('@matteo.collina/sqlite-pool')
+ const sqlite = await import('@matteo.collina/sqlite-pool')
  const path = connectionString.replace('sqlite://', '')
  db = sqlite.default(
    connectionString === 'sqlite://:memory:' ? undefined : path,
    {},
    {
```

**Recommendation**: **Option A** (simpler, matches destructuring pattern already used)

## Impact

- **Severity**: High
- **Affected Users**: Anyone using SQLite with:
  - ESM projects (`"type": "module"`)
  - Modern test runners (node:test, Vitest)
  - TypeScript with native ESM output
  - Any environment using dynamic `import()` for SQLite

- **Workarounds**:
  1. Use PostgreSQL instead of SQLite (changes production stack)
  2. Use CommonJS (`require`) - not viable for pure ESM projects
  3. Patch node_modules (lost on reinstall)

## Additional Context

### Why This Wasn't Caught Earlier

The bug likely exists because:

1. Platformatic DB tests might use CommonJS (`require`) which handles exports differently
2. Bundlers (webpack, esbuild) often normalize `.default` access automatically
3. SQLite tests might be skipped in CI if PostgreSQL is the primary target

### Verification

Check if the source TypeScript has the same issue:

```typescript
// In @platformatic/sql-mapper source (likely lib/sqlite.ts)
const { default: sqlite } = await import('@matteo.collina/sqlite-pool')
// ...
db = sqlite.default(...)  // Should be: db = sqlite(...)
```

## Related Issues

- Similar ESM import issues: [link if any exist]
- Discussion about ESM support in Platformatic: [link if exists]

## Testing the Fix

After applying the fix, verify with:

```bash
# Unit test
npm test

# Integration test with SQLite ESM
cd examples/sqlite-esm
npm install
npm test
```

## Checklist for Maintainers

- [ ] Fix the double `.default` access in sql-mapper
- [ ] Add ESM-specific test suite for SQLite
- [ ] Verify PostgreSQL/MySQL code paths don't have similar issues
- [ ] Update documentation about ESM + SQLite support
- [ ] Consider adding ESM tests to CI pipeline

---

**Reported by**: Antonio Cittadino  
**Date**: 2025-12-13  
**Platformatic Version**: 3.27.0  
**Package**: @platformatic/sql-mapper  
**Node.js Version**: 22.19.0
