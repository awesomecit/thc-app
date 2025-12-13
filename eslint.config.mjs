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
);
