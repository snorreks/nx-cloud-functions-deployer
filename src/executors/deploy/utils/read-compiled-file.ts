import type { BuildFunctionData, Environment } from '$types';
import { logger } from '$utils';
import { readFile } from 'node:fs/promises';
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
		let code = await readFile(outputPath, 'utf8');
		if (deployableFileLiteData.hasLoggerFile) {
			try {
				const loggerFilePath = join(outputRoot, 'src/logger.js');
				const loggerCode = await readFile(loggerFilePath, 'utf8');
				code = code + loggerCode;
			} catch (error) {
				logger.error('getLoggerCode', error);
			}
		}

		return Object.fromEntries(
			Object.entries(environment).filter(([key]) => code.includes(key)),
		);
	} catch (error) {
		logger.error('getEnvironmentKeysNeeded', error);
		return;
	}
};
