import { join } from 'node:path';
import { logger } from './logger';
import { config } from 'dotenv';
import { toDotEnvironmentCode } from './common';

export const getEnvironmentFileCode = async (options: {
	prodEnvFileName?: string;
	devEnvFileName?: string;
	prod?: boolean;
	projectRoot: string;
	envString?: string;
}): Promise<string | undefined> => {
	const prodEnvFileName = options.prodEnvFileName || '.env.prod';
	const devEnvFileName = options.devEnvFileName || '.env.dev';
	const envFileName = options.prod ? prodEnvFileName : devEnvFileName;
	try {
		if (options.envString) {
			return options.envString;
		}

		const environment = config({
			path: join(options.projectRoot, envFileName),
		});
		if (!environment.parsed) {
			return;
		}

		return toDotEnvironmentCode(environment.parsed);
	} catch (error) {
		logger.warn(
			`Could not find environment file "${envFileName}", Environment variables will not be available in the deployed functions.`,
		);
		logger.debug(error);
		return;
	}
};
