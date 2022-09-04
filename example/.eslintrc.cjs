/* jshint esversion: 9 */

/** @type {import('eslint').ESLint} */
const config = {
	env: {
		es2017: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'prettier',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
		'plugin:sort/recommended',
		'plugin:unicorn/recommended',
	],
	ignorePatterns: ['apps/**/*', 'libs/**/*'],
	overrides: [
		{
			extends: ['plugin:@nrwl/nx/typescript'],
			files: ['*.ts', '*.tsx', '*.svelte'],
			rules: {},
		},
		{
			extends: ['plugin:@nrwl/nx/javascript'],
			files: ['*.js', '*.jsx', '*.svelte'],
			rules: {},
		},
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	plugins: [
		'@nrwl/nx',
		'sort-class-members',
		'sort',
		'import',
		'unicorn',
	],

	root: true,
	rules: {
		'import/default': 2,
		'import/export': 2,
		'import/named': 0,
		'import/namespace': 2,
		'import/no-cycle': 2,
		'import/no-unresolved': [
			0,
			{
				amd: true,
				caseSensitive: true,
				commonjs: true,
			},
		],
		'prettier/prettier': 'error',
		'require-jsdoc': 'off',
		'spaced-comment': [2, 'always', { exceptions: ['-'], markers: ['/'] }],
		'unicorn/filename-case': 0,
		'unicorn/no-await-expression-member': 0,
		'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
		'unicorn/prefer-module': 0,
		'valid-jsdoc': [
			1,
			{
				requireParamType: false,
				requireReturn: false,
				requireReturnType: false,
			},
		],
	},
};

module.exports = config;
