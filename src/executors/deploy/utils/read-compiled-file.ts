import type { BuildFunctionData, Environment } from '$types';
import { logger } from '$utils';
import { readFile } from 'fs/promises';
import { join } from 'node:path';

export const getEnvironmentNeeded = async (
	deployableFileLiteData: BuildFunctionData,
): Promise<Environment | undefined> => {
	try {
		const { outputRoot, environment } = deployableFileLiteData;
		if (!environment) {
			return;
		}
		const outputPath = join(outputRoot, 'src/index.js');
		const code = await readFile(outputPath, 'utf8');

		return Object.fromEntries(
			Object.entries(environment).filter(([key]) => code.includes(key)),
		);
	} catch (error) {
		logger.error('getEnvironmentKeysNeeded', error);
		return;
	}
};
