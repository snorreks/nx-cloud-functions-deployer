import { join } from 'node:path';
import { logger } from './logger';
import { config } from 'dotenv';
import type { BaseDeployOptions, Environment } from '$types';
import { getEnvironmentFileName } from './common';
import { execute } from './execute';

export const validateProject = async ({
	packageManager,
	projectRoot,
	validate,
	tsconfig,
}: Pick<
	BaseDeployOptions,
	'packageManager' | 'projectRoot' | 'validate' | 'tsconfig'
>) => {
	if (!validate) {
		return;
	}
	const commandArguments: string[] = ['tsc', '-noEmit'];

	if (tsconfig) {
		commandArguments.push('--project', tsconfig);
	}
	// if (logger.verbose) {
	// 	commandArguments.push('--verbose');
	// }
	logger.info('Validating project...');
	await execute({
		packageManager,
		cwd: projectRoot,
		commandArguments,
	});
};

export const getEnvironment = async (options: {
	flavor: string;
	projectRoot: string;
	envString?: string;
	envFiles?: Record<string, string>;
}): Promise<Environment | undefined> => {
	const envFileName = getEnvironmentFileName(options);

	try {
		if (options.envString) {
			return parseEnvironment(options.envString);
		}

		const environment = config({
			path: join(options.projectRoot, envFileName),
		});
		if (!environment.parsed) {
			return;
		}

		return environment.parsed;
	} catch (error) {
		logger.warn(
			`Could not find environment file "${envFileName}", Environment variables will not be available in the deployed functions.`,
		);
		logger.debug(error);
		return;
	}
};

/**
 * Convert a stringified environment to `Environment` type
 *
 * @param envString - Stringified environment
 * @returns Environment
 */
export const parseEnvironment = (envString: string): Environment => {
	const environment: Environment = {};
	const lines = envString.split('\n');
	lines.forEach((line) => {
		setEnvironment(line, environment);
	});
	return environment;
};

/**
 * Find content that is between a character in a string
 *
 * @example const string = 'this is a test "banana", that has text!';
 *
 * const result = findContentBetween(string, '"');
 *
 * console.log(result); // 'banana'
 *
 * @param string - String to search
 * @param character - Character to search for
 * @param reverse - Search from the end of the string
 * @returns the content between the character, or undefined if not found.
 */
export const findContentBetween = (
	string: string,
	character: string,
	reverse = false,
): string | undefined => {
	const start = reverse
		? getSecondToLastIndexOf(string, character)
		: string.indexOf(character);
	const end = reverse
		? string.lastIndexOf(character)
		: getSecondToFirstIndexOf(string, character);

	if (start === -1 || end === -1) {
		return;
	}
	return string.substring(start + 1, end).trim();
};

const setEnvironment = (line: string, environment: Environment): void => {
	// get all instances of `=` in the line
	const equalSignIndexes = getIndexesOf(line, '=');
	if (equalSignIndexes.length === 0) {
		return;
	}
	let lastIndex = 0;
	for (const equalSignIndex of equalSignIndexes) {
		const currentLine = line.substring(lastIndex, equalSignIndex);
		setEnvironmentFromLine(currentLine, environment);
		lastIndex = currentLine.length;
	}
};

const getIndexesOf = (string: string, character: string): number[] => {
	const indexes: number[] = [];
	let index = string.indexOf(character);
	while (index !== -1) {
		indexes.push(index);
		index = string.indexOf(character, index + 1);
	}
	return indexes;
};

const setEnvironmentFromLine = (
	line: string,
	environment: Environment,
): void => {
	const index = line.indexOf('=');
	if (index === -1) {
		return;
	}
	const lineBefore = line.substring(0, index);
	const lineAfter = line.substring(index + 1);

	const environmentKey = getEnvironmentKey(lineBefore);
	const environmentValue = getEnvironmentValue(lineAfter);

	if (!environmentKey || !environmentValue) {
		return;
	}

	environment[environmentKey] = environmentValue;
};

const getEnvironmentKey = (line: string): string | undefined =>
	findContentBetween(line, '"', true);

const getEnvironmentValue = (line: string): string | undefined =>
	findContentBetween(line, '"');

const getSecondToLastIndexOf = (string: string, character: string): number => {
	const index = string.lastIndexOf(character);
	if (index === -1) {
		return -1;
	}
	return string.lastIndexOf(character, index - 1);
};

const getSecondToFirstIndexOf = (string: string, character: string): number => {
	const index = string.indexOf(character);
	if (index === -1) {
		return -1;
	}
	return string.indexOf(character, index + 1);
};
