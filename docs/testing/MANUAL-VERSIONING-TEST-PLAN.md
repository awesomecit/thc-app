# Manual Versioning Test Plan

**Purpose**: Verify semantic versioning logic with deterministic test scenarios  
**Tool**: `scripts/auto-release.js`  
**Version**: 1.0.0  
**Last Updated**: 2025-12-14

---

## 🎯 Test Objectives

1. ✅ Verify version bump calculation (PATCH, MINOR, MAJOR)
2. ✅ Verify breaking change detection (!, BREAKING CHANGE footer)
3. ✅ Verify commit type filtering (feat, fix, refactor, docs, chore)
4. ✅ Verify dry-run mode (preview without changes)
5. ✅ Verify CHANGELOG generation format
6. ✅ Verify feature.json generation (if implemented)
7. ✅ Verify Git tag creation and push

---

## 🧪 Test Environment Setup

### Prerequisites

```bash
# 1. Create test repository
mkdir -p /tmp/versioning-test
cd /tmp/versioning-test
git init

# 2. Initialize npm project
npm init -y
npm pkg set version="0.1.0"

# 3. Create initial commit
git add package.json
git commit -m "chore: initial commit"
git tag v0.1.0

# 4. Copy auto-release.js script
cp /path/to/thc-app/scripts/auto-release.js ./scripts/
```

### Test Data Structure

```
/tmp/versioning-test/
├── package.json (version: 0.1.0)
├── scripts/
│   └── auto-release.js
└── .git/ (tag v0.1.0)
```

---

## 📋 Test Cases

### Test Case 1: PATCH Version Bump (fix:)

**Scenario**: Bug fix should increment PATCH (0.1.0 → 0.1.1)

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/patch-bump
echo "// Bug fix" >> index.js
git add index.js
git commit -m "fix(auth): prevent token leak in logs"
```

**Expected Behavior**:

- ✅ Version: `0.1.0 → 0.1.1`
- ✅ CHANGELOG entry under `### Bug Fixes`
- ✅ Commit type: `fix`
- ✅ Scope: `auth`

**Execution**:

```bash
# Dry-run (preview)
npm run release:suggest

# Expected output:
# Current version: 0.1.0
# Next version: 0.1.1 (PATCH)
# Changes:
# - fix(auth): prevent token leak in logs (abc1234)
```

**Verification**:

```bash
# Check version NOT changed yet
grep '"version"' package.json  # Should be 0.1.0

# Execute release
npm run release

# Verify version changed
grep '"version"' package.json  # Should be 0.1.1
git tag | grep v0.1.1          # Tag should exist
```

**Pass Criteria**:

- [ ] Dry-run shows `0.1.1` as next version
- [ ] package.json updated to `0.1.1`
- [ ] Git tag `v0.1.1` created
- [ ] CHANGELOG has `## [0.1.1] - YYYY-MM-DD` section
- [ ] Commit listed under `### Bug Fixes`

**Rollback**:

```bash
git tag -d v0.1.1
git reset --hard v0.1.0
npm pkg set version="0.1.0"
```

---

### Test Case 2: MINOR Version Bump (feat:)

**Scenario**: New feature should increment MINOR (0.1.1 → 0.2.0)

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/minor-bump
echo "// New feature" >> feature.js
git add feature.js
git commit -m "feat(gateway): add circuit breaker for patient-api"
```

**Expected Behavior**:

- ✅ Version: `0.1.1 → 0.2.0` (PATCH resets to 0)
- ✅ CHANGELOG entry under `### Features`
- ✅ Commit type: `feat`
- ✅ Scope: `gateway`

**Execution**:

```bash
npm run release:suggest
# Expected: Next version: 0.2.0 (MINOR)

npm run release
```

**Verification**:

```bash
grep '"version"' package.json  # Should be 0.2.0
git tag | grep v0.2.0          # Tag should exist
grep "## \[0.2.0\]" CHANGELOG.md  # Entry exists
grep "### Features" CHANGELOG.md  # Section exists
```

**Pass Criteria**:

- [ ] Dry-run shows `0.2.0` as next version
- [ ] PATCH counter reset to 0
- [ ] package.json updated to `0.2.0`
- [ ] Git tag `v0.2.0` created
- [ ] CHANGELOG has `### Features` section
- [ ] Commit listed with scope `(gateway)`

**Rollback**:

```bash
git tag -d v0.2.0
git reset --hard v0.1.1
npm pkg set version="0.1.1"
```

---

### Test Case 3: MAJOR Version Bump (BREAKING CHANGE)

**Scenario**: Breaking change should increment MAJOR (0.2.0 → 1.0.0)

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/major-bump
echo "// Breaking change" >> breaking.js
git add breaking.js
git commit -m "feat(auth)!: change token format to JWT

BREAKING CHANGE: Token format changed from custom to JWT.
Old tokens are invalid. Users must re-authenticate."
```

**Expected Behavior**:

- ✅ Version: `0.2.0 → 1.0.0` (MINOR and PATCH reset to 0)
- ✅ CHANGELOG entry under `### BREAKING CHANGES`
- ✅ Commit type: `feat!` (exclamation mark detected)
- ✅ Breaking change footer detected

**Execution**:

```bash
npm run release:suggest
# Expected: Next version: 1.0.0 (MAJOR)
# Expected: WARNING: BREAKING CHANGES detected

npm run release
```

**Verification**:

```bash
grep '"version"' package.json  # Should be 1.0.0
git tag | grep v1.0.0          # Tag should exist
grep "## \[1.0.0\]" CHANGELOG.md  # Entry exists
grep "### BREAKING CHANGES" CHANGELOG.md  # Section exists
grep "Token format changed" CHANGELOG.md  # Breaking change description included
```

**Pass Criteria**:

- [ ] Dry-run shows `1.0.0` as next version
- [ ] Dry-run warns about breaking changes
- [ ] MINOR and PATCH reset to 0
- [ ] package.json updated to `1.0.0`
- [ ] Git tag `v1.0.0` created
- [ ] CHANGELOG has `### BREAKING CHANGES` section
- [ ] Full breaking change message included in CHANGELOG

**Rollback**:

```bash
git tag -d v1.0.0
git reset --hard v0.2.0
npm pkg set version="0.2.0"
```

---

### Test Case 4: No Version Bump (Non-Releasable Commits)

**Scenario**: Only chore/docs/style commits → NO version bump

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/no-bump
echo "# Updated" >> README.md
git add README.md
git commit -m "docs: update README with installation steps"

echo "// Refactor" >> utils.js
git add utils.js
git commit -m "refactor: extract helper function"

echo "module.exports = {}" > .eslintrc.js
git add .eslintrc.js
git commit -m "chore: update ESLint config"
```

**Expected Behavior**:

- ✅ Version: `1.0.0 → 1.0.0` (NO CHANGE)
- ✅ Script exits with message "No releasable changes"
- ✅ No tag created
- ✅ No CHANGELOG update

**Execution**:

```bash
npm run release:suggest
# Expected: "No releasable changes detected. Version remains 1.0.0"
```

**Verification**:

```bash
grep '"version"' package.json  # Should still be 1.0.0
git tag | grep v1.0.0 | wc -l  # Should be 1 (only old tag)
```

**Pass Criteria**:

- [ ] Dry-run reports "No releasable changes"
- [ ] package.json version unchanged
- [ ] No new Git tag created
- [ ] CHANGELOG not modified
- [ ] Script exits with exit code 0 (success, but no-op)

**Rollback**: Not needed (no changes made)

---

### Test Case 5: Multiple Commits Mixed Types

**Scenario**: Batch of commits with different types → Highest priority wins

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/mixed-commits

# PATCH (fix)
echo "// Fix 1" >> fix1.js
git add fix1.js
git commit -m "fix(db): prevent connection leak"

# PATCH (fix)
echo "// Fix 2" >> fix2.js
git add fix2.js
git commit -m "fix(cache): handle Redis timeout"

# MINOR (feat) - This should win
echo "// Feature" >> feat.js
git add feat.js
git commit -m "feat(api): add health check endpoint"

# Non-releasable (docs)
echo "# Docs" >> docs.md
git add docs.md
git commit -m "docs: add API documentation"
```

**Expected Behavior**:

- ✅ Version: `1.0.0 → 1.1.0` (MINOR wins over PATCH)
- ✅ CHANGELOG has both `### Features` and `### Bug Fixes`
- ✅ docs commit ignored (not listed)

**Execution**:

```bash
npm run release:suggest
# Expected: Next version: 1.1.0 (MINOR)
# Expected:
# Features: 1
# Bug Fixes: 2
# Docs: 1 (ignored)

npm run release
```

**Verification**:

```bash
grep '"version"' package.json  # Should be 1.1.0
grep "### Features" CHANGELOG.md  # Section exists
grep "### Bug Fixes" CHANGELOG.md  # Section exists
grep "health check" CHANGELOG.md  # Feature listed
grep "connection leak" CHANGELOG.md  # Fix 1 listed
grep "Redis timeout" CHANGELOG.md  # Fix 2 listed
grep "add API documentation" CHANGELOG.md && echo "FAIL: docs should be ignored" || echo "PASS"
```

**Pass Criteria**:

- [ ] Dry-run shows `1.1.0` (MINOR wins)
- [ ] Dry-run summary shows 1 feature, 2 fixes
- [ ] CHANGELOG has separate sections for features and fixes
- [ ] docs commit NOT in CHANGELOG
- [ ] All releasable commits listed

**Rollback**:

```bash
git tag -d v1.1.0
git reset --hard v1.0.0
npm pkg set version="1.0.0"
```

---

### Test Case 6: Breaking Change Detection Variants

**Scenario**: Test all breaking change detection patterns

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/breaking-variants

# Variant 1: Exclamation mark
echo "// Breaking 1" >> break1.js
git add break1.js
git commit -m "feat(api)!: remove deprecated /v1/users endpoint"

# Variant 2: BREAKING CHANGE footer (all caps)
echo "// Breaking 2" >> break2.js
git add break2.js
git commit -m "fix(auth): update JWT validation

BREAKING CHANGE: Token signature algorithm changed to ES256"

# Variant 3: BREAKING-CHANGE footer (with hyphen)
echo "// Breaking 3" >> break3.js
git add break3.js
git commit -m "refactor(db): rename user table

BREAKING-CHANGE: Database table 'users' renamed to 'accounts'"
```

**Expected Behavior**:

- ✅ Version: `1.1.0 → 2.0.0` (MAJOR)
- ✅ All 3 variants detected as breaking changes
- ✅ CHANGELOG lists all 3 under `### BREAKING CHANGES`

**Execution**:

```bash
npm run release:suggest
# Expected: Next version: 2.0.0 (MAJOR)
# Expected: WARNING: 3 BREAKING CHANGES detected

npm run release
```

**Verification**:

```bash
grep '"version"' package.json  # Should be 2.0.0
grep "### BREAKING CHANGES" CHANGELOG.md  # Section exists
grep "remove deprecated" CHANGELOG.md  # Breaking 1 listed
grep "ES256" CHANGELOG.md  # Breaking 2 listed
grep "renamed to 'accounts'" CHANGELOG.md  # Breaking 3 listed
```

**Pass Criteria**:

- [ ] All 3 breaking change patterns detected (`!`, `BREAKING CHANGE:`, `BREAKING-CHANGE:`)
- [ ] Version bumped to MAJOR (2.0.0)
- [ ] CHANGELOG has all 3 breaking changes with descriptions
- [ ] Warning shown during dry-run

**Rollback**:

```bash
git tag -d v2.0.0
git reset --hard v1.1.0
npm pkg set version="1.1.0"
```

---

### Test Case 7: Scope Handling

**Scenario**: Verify scope extraction and formatting

**Setup**:

```bash
cd /tmp/versioning-test
git checkout -b test/scopes

# With scope
git commit --allow-empty -m "feat(gateway): add rate limiting"
git commit --allow-empty -m "fix(auth): validate scope claims"

# Without scope
git commit --allow-empty -m "feat: add Docker Compose support"
git commit --allow-empty -m "fix: prevent memory leak"
```

**Expected Behavior**:

- ✅ Scopes extracted correctly: `(gateway)`, `(auth)`
- ✅ No-scope commits work: no parentheses in CHANGELOG
- ✅ CHANGELOG format: `- **gateway**: add rate limiting` or `- add Docker Compose support`

**Execution**:

```bash
npm run release:suggest
npm run release
```

**Verification**:

```bash
# Verify CHANGELOG formatting
grep "\*\*gateway\*\*" CHANGELOG.md  # Should match
grep "\*\*auth\*\*" CHANGELOG.md  # Should match
grep "add Docker Compose support" CHANGELOG.md  # No scope prefix
grep "prevent memory leak" CHANGELOG.md  # No scope prefix
```

**Pass Criteria**:

- [ ] Scoped commits: `- **scope**: description`
- [ ] No-scope commits: `- description`
- [ ] No parsing errors
- [ ] All commits correctly categorized

**Rollback**:

```bash
git reset --hard v1.1.0
```

---

## 🔍 Edge Cases Testing

### Edge Case 1: First Release (No Previous Tag)

**Setup**:

```bash
cd /tmp/versioning-test-first-release
git init
npm init -y
npm pkg set version="0.0.0"
git add package.json
git commit -m "chore: initial commit"
git commit --allow-empty -m "feat: initial implementation"
```

**Expected**: Version `0.0.0 → 0.1.0` (first feature)

**Verification**:

```bash
npm run release:suggest
# Should detect no previous tags and start from package.json version
```

---

### Edge Case 2: Invalid Conventional Commit Format

**Setup**:

```bash
cd /tmp/versioning-test
git commit --allow-empty -m "This is not a conventional commit"
git commit --allow-empty -m "Add some stuff"
```

**Expected**:

- ⚠️ Commits ignored with warning
- ⚠️ No version bump (unless other valid commits exist)

**Verification**:

```bash
npm run release:suggest
# Should warn: "Skipped 2 commits with invalid format"
```

---

### Edge Case 3: Monorepo Multi-Scope

**Setup**:

```bash
git commit --allow-empty -m "feat(frontend): add login page"
git commit --allow-empty -m "feat(backend): add auth endpoint"
git commit --allow-empty -m "fix(db): optimize user query"
```

**Expected**:

- ✅ All scopes listed in CHANGELOG
- ✅ MINOR version bump (feat wins)

**Verification**:

```bash
npm run release
grep "frontend" CHANGELOG.md  # Should exist
grep "backend" CHANGELOG.md  # Should exist
grep "db" CHANGELOG.md  # Should exist
```

---

## 📊 Test Results Template

Use this checklist to track test execution:

```markdown
## Test Run: YYYY-MM-DD HH:MM

| Test Case              | Pass | Fail | Notes                       |
| ---------------------- | ---- | ---- | --------------------------- |
| TC1: PATCH bump        | ☑️   | ☐    | Version 0.1.0→0.1.1 ✅      |
| TC2: MINOR bump        | ☑️   | ☐    | Version 0.1.1→0.2.0 ✅      |
| TC3: MAJOR bump        | ☑️   | ☐    | Breaking change detected ✅ |
| TC4: No bump           | ☑️   | ☐    | Ignored chore/docs ✅       |
| TC5: Mixed commits     | ☑️   | ☐    | MINOR won over PATCH ✅     |
| TC6: Breaking variants | ☑️   | ☐    | All 3 patterns detected ✅  |
| TC7: Scope handling    | ☑️   | ☐    | Formatted correctly ✅      |
| EC1: First release     | ☑️   | ☐    | Started from 0.0.0 ✅       |
| EC2: Invalid format    | ☑️   | ☐    | Warning shown ✅            |
| EC3: Monorepo scopes   | ☑️   | ☐    | All scopes listed ✅        |

**Overall Result**: ✅ PASS / ❌ FAIL  
**Tested By**: [Your Name]  
**Script Version**: 1.0.0  
**Issues Found**: [List any bugs]
```

---

## 🚀 Automation (Optional Future)

Once manual tests pass, automate with:

```bash
# Create test/auto-release.test.js
npm install -D jest @types/jest

# Run automated tests
npm run test:versioning
```

**Test structure**:

```javascript
describe('Semantic Versioning', () => {
  it('should bump PATCH for fix commits', async () => {
    // Setup mock git repo
    // Run auto-release.js
    // Assert version 0.1.0 → 0.1.1
  });
});
```

---

## 📝 Reporting

After each test run, document:

1. **Date/Time** of test execution
2. **Test environment** (OS, Node version, Git version)
3. **Pass/Fail status** for each test case
4. **Issues discovered** with reproduction steps
5. **Recommendations** for script improvements

**Example Report**:

```markdown
## Test Report: 2025-12-14 15:30

**Environment**:

- OS: Ubuntu 22.04
- Node: v22.0.0
- Git: 2.43.0

**Results**: 10/10 tests passed ✅

**Issues**: None

**Recommendations**: Script ready for production use.
```

---

## ✅ Sign-off Criteria

Script is ready for production when:

- [ ] All 7 test cases pass
- [ ] All 3 edge cases pass
- [ ] Dry-run mode works correctly
- [ ] CHANGELOG format is correct
- [ ] Git tags created successfully
- [ ] No false positives (invalid version bumps)
- [ ] No false negatives (missed breaking changes)
- [ ] Error messages are clear and actionable
- [ ] Documentation is complete

**Approved By**: **\*\***\_\_\_\_**\*\***  
**Date**: **\*\***\_\_\_\_**\*\***
