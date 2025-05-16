import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

// Import the ignores from the previous .eslintignore file
const ignores = [
  '**/node_modules/**',
  'dist/**',
  '**/*.js',
  '!build-package.js',
  'pnpm-lock.yaml',
  // Example directory has its own eslint config
  'example/**', // Exclude example directory as it has its own config
];

// Create the TypeScript configuration using tseslint.config
const typescript = tseslint.config(
  {
    // Setup TypeScript parser for all TS files
    files: ['**/*.ts'],
    extends: [
      // Use only direct objects, not arrays
      tseslint.configs.recommended,
    ],
    languageOptions: {
      parser: tseslint.parser,
      // Disable project requirement for now to prevent parsing errors
      parserOptions: {
        project: null,
      },
    },
    // Override certain rules that are causing issues
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
      '@typescript-eslint/no-unused-expressions': 'warn', // Downgrade to warning
    },
  }
);

// For CommonJS files (.cjs)
const commonjs = {
  files: ['**/*.cjs'],
  languageOptions: {
    sourceType: 'commonjs',
    ecmaVersion: 2022,
    globals: {
      module: 'readonly',
      require: 'readonly',
    },
  },
};

export default [
  // Add ignores (replacing .eslintignore)
  { ignores },

  // Base config for all files
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // CommonJS specific configuration
  commonjs,

  // Core ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript configuration
  ...typescript,

  // Prettier integration
  prettierConfig,
  prettierPlugin,

  // Custom rules for all files
  {
    rules: {
      'require-jsdoc': 'off',
      'spaced-comment': ['error', 'always', { exceptions: ['-'], markers: ['/'] }],
      // Allow unused catch parameters
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
    },
  },
];
