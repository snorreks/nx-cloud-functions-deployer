/* jshint esversion: 9 */

/** @type {import('eslint').ESLint} */
const config = {
	env: {
		browser: true,
	},
	extends: ['../../../.eslintrc.cjs'],
	ignorePatterns: ['!**/*'],
	overrides: [
		{
			files: ['*.ts', '*.js'],
			parserOptions: {
				project: ['libs/shared/utils/tsconfig.*?.json'],
			},
			rules: {},
		},
		{
			files: ['*.ts'],
			rules: {},
		},
		{
			files: ['*.js'],
			rules: {},
		},
	],
};

module.exports = config;
