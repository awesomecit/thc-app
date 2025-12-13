/**
 * Commitlint Configuration
 * Enforces Conventional Commits specification
 *
 * Format: <type>(<scope>): <subject>
 *
 * Types:
 * - feat: New feature (MINOR version bump)
 * - fix: Bug fix (PATCH version bump)
 * - docs: Documentation only
 * - style: Code style/formatting
 * - refactor: Code refactoring
 * - test: Tests
 * - chore: Maintenance
 * - perf: Performance improvements
 * - ci: CI/CD changes
 * - build: Build system changes
 * - revert: Revert previous commit
 *
 * Breaking Changes:
 * - Add '!' after type: feat(api)!: change endpoint
 * - Or add 'BREAKING CHANGE:' in footer (MAJOR version bump)
 *
 * @see https://www.conventionalcommits.org/
 * @see https://github.com/conventional-changelog/commitlint
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject case: allow sentence-case, start-case, pascal-case, upper-case
    'subject-case': [0],
    // Body and footer max line length
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting, missing semicolons, etc.
        'refactor', // Refactoring code
        'perf', // Performance improvements
        'test', // Adding tests
        'build', // Build system or dependencies
        'ci', // CI/CD configuration
        'chore', // Other changes (tooling, etc.)
        'revert', // Revert previous commit
      ],
    ],
    // Scope can be empty
    'scope-empty': [0],
    // Subject should not end with period
    'subject-full-stop': [2, 'never', '.'],
    // Subject should not be empty
    'subject-empty': [2, 'never'],
    // Subject min length
    'subject-min-length': [2, 'always', 10],
  },
};
