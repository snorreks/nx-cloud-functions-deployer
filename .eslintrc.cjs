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
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	root: true,
	rules: {
		'require-jsdoc': 'off',
		'spaced-comment': [2, 'always', { exceptions: ['-'], markers: ['/'] }],
		'valid-jsdoc': [
			0,
			{
				requireParamType: false,
				requireReturn: false,
				requireReturnType: false,
			},
		],
	},
};

module.exports = config;
