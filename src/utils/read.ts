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
			return parseJsonStringEnvironment(options.envString);
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
 * Convert a stringified json environment to `Environment` type
 *
 * @param envJsonString - Stringified json environment
 * @returns Environment
 */
export const parseJsonStringEnvironment = (
	envJsonString: string,
): Environment => {
	const environment: Environment = JSON.parse(envJsonString);
	return environment;
};
