/** @type {import('eslint').ESLint} */
const config = {
	env: {
		es2017: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'prettier',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
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
	plugins: ['@nrwl/nx'],

	root: true,
	rules: {
		'require-jsdoc': 'off',
		'spaced-comment': [2, 'always', { exceptions: ['-'], markers: ['/'] }],
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
