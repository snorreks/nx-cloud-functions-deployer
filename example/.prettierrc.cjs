/* jshint esversion: 9 */

/** @type {import('prettier').Config} */
const config = {
	arrowParens: 'always',
	bracketSameLine: true,
	endOfLine: 'auto',
	jsdocCapitalizeDescription: false,
	plugins: [require('prettier-plugin-jsdoc')],
	semi: true,
	singleQuote: true,
	tabWidth: 4,
	trailingComma: 'all',
	tsdoc: true,
	useTabs: true,
};

module.exports = config;
