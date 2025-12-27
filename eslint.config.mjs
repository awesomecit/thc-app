// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.watt/**',
      '**/*.d.ts',
      '**/coverage/**',
      '**/.husky/**',
      '**/docs/**',
      '**/packages/auth/test/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      // Git submodules
      'web/ticops-field-mapper/**',
      'web/ticops-frontend/**',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // SonarJS recommended rules
  sonarjs.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // ===== COMPLEXITY LIMITS =====
      // Cognitive Complexity: measures mental effort to understand code
      'sonarjs/cognitive-complexity': ['error', 10],

      // Cyclomatic Complexity: counts independent paths through code
      complexity: ['error', { max: 10 }],

      // Max lines per function: prevents God functions
      'max-lines-per-function': [
        'warn',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // ===== CODE QUALITY =====
      // No duplicate code blocks
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],

      // Prefer early returns over nested if-else
      'sonarjs/prefer-immediate-return': 'error',

      // No identical functions
      'sonarjs/no-identical-functions': 'error',

      // No unused expressions
      'sonarjs/no-gratuitous-expressions': 'error',

      // ===== TYPESCRIPT SPECIFIC =====
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      '@typescript-eslint/no-explicit-any': 'error',

      '@typescript-eslint/no-floating-promises': 'error',

      '@typescript-eslint/no-misused-promises': 'error',

      // ===== MAINTAINABILITY =====
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      'prefer-const': 'error',

      'no-var': 'error',

      eqeqeq: ['error', 'always'],

      curly: ['error', 'all'],

      // Max depth of nested blocks
      'max-depth': ['error', 3],

      // Max nested callbacks
      'max-nested-callbacks': ['error', 3],

      // Max parameters per function
      'max-params': ['warn', 5],
    },
  },

  // Disable type-checking for JS files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Relaxed rules for test files
  {
    files: ['**/test/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Allow any in test configs (JSON.parse, etc.)
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Allow implicit return types in test helpers
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow nullish coalescing for config defaults
      '@typescript-eslint/prefer-nullish-coalescing': 'off',

      // Keep floating promises error - tests should await properly
      '@typescript-eslint/no-floating-promises': 'error',

      // Allow TODO/FIXME in tests for tracking known issues
      'sonarjs/todo-tag': 'off',
      'sonarjs/fixme-tag': 'off',
    },
  },

  // Config files (allow TODO/FIXME for planning)
  {
    files: ['eslint.config.mjs', '**/*.config.{js,mjs,cjs}'],
    rules: {
      'sonarjs/todo-tag': 'off',
      'sonarjs/fixme-tag': 'off',
    },
  },

  // Relaxed rules for plugin files and routes
  {
    files: ['**/plugins/**/*.ts', '**/routes/**/*.ts'],
    rules: {
      // Dashboard plugin has large HTML template - expected
      'max-lines-per-function': 'off',
      // Fastify routes/plugins registration doesn't need await
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Node.js scripts configuration
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
      parserOptions: {
        // Scripts don't have tsconfig
        projectService: false,
      },
    },
    rules: {
      // Allow console in scripts
      'no-console': 'off',

      // Allow process.exit in CLI scripts
      'no-process-exit': 'off',

      // Scripts can be longer
      'max-lines-per-function': ['warn', { max: 100 }],

      // No return types needed in JS scripts
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow string duplication for CLI output
      'sonarjs/no-duplicate-string': 'off',

      // Nested templates acceptable for CLI formatting
      'sonarjs/no-nested-template-literals': 'off',

      // TypeScript rules don't apply to JS
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  }
);
