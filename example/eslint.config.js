import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

// Import the ignores from the previous .eslintignore file
const ignores = [
	// Files with these extensions are often replaced within angular json and dont really exist inside the project
	'**/*.mock.ts',
	'**/*.uat.ts',
	'**/*.production.ts',
	'**/*.test.ts',

	// Generics
	'node_modules/**',
	'**/node_modules/**',
	'dist/**',
	'ssl/**',

	'**/*.aws-sam',
	'**/*.svelte-kit',
	'tools/**/*.js',
	'pnpm-lock.yaml',
	'storybook-static',
];

// Create the TypeScript configuration using tseslint.config
const typescript = tseslint.config({
	// Setup TypeScript parser for all TS files
	files: ['**/*.ts', '**/*.tsx'],
	extends: [tseslint.configs.recommended],
	languageOptions: {
		parser: tseslint.parser,
		parserOptions: {
			// Disable project requirement to prevent parsing errors
			project: null,
		},
	},
	// Override certain rules that are causing issues
	rules: {
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'@typescript-eslint/no-unused-expressions': 'warn', // Downgrade to warning
		'require-jsdoc': 'off',
		'spaced-comment': [
			'error',
			'always',
			{ exceptions: ['-'], markers: ['/'] },
		],
	},
});

// Configuration for JavaScript files
const javascript = {
	files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
	languageOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		globals: {
			module: 'readonly',
			require: 'readonly',
		},
	},
	rules: {
		'require-jsdoc': 'off',
		'spaced-comment': [
			'error',
			'always',
			{ exceptions: ['-'], markers: ['/'] },
		],
	},
};

// NOTE: The @nx plugins are not directly imported here as they may not be fully
// compatible with ESLint 9's flat config system yet. You may need to modify this
// configuration once Nx provides official support for ESLint 9 flat config.

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

	// JavaScript specific configuration
	javascript,

	// Core ESLint recommended rules
	eslint.configs.recommended,

	// TypeScript configuration
	...typescript,

	// Prettier integration
	prettierConfig,
	prettierPlugin,
];
