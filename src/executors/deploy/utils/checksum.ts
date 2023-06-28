import type { DeployFunctionData } from '$types';
import { logger } from '$utils';
import chalk from 'chalk';
import { createHash } from 'crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const algorithm = 'md5';
const encoding = 'hex';

const checksumsFolderName = '.checksums';

export const checksumsFolderPath = (options: {
	outputDirectory: string;
	flavor: string;
}): string =>
	join(options.outputDirectory, checksumsFolderName, options.flavor);

// function that makes a Record<string, string> into a string

const recordToString = (record: Record<string, string | undefined>): string => {
	return Object.entries(record)
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.map(([key, value]) => `${key}=${value}`)
		.join(''); // sort the keys so that the order doesn't matter
};

/**
 * Check for changes in the code of the function
 *
 * @returns the deploy function data if the code has changed or it failed to get
 *   the cached checksum
 */
export const checkForChanges = async (
	deployFunction: DeployFunctionData,
): Promise<DeployFunctionData | undefined> => {
	try {
		const { environment, outputRoot } = deployFunction;

		let newCode = await readFile(join(outputRoot, 'src/index.js'), 'utf8');

		if (deployFunction.hasLoggerFile) {
			try {
				const loggerFilePath = join(outputRoot, 'src/logger.js');
				const loggerCode = await readFile(loggerFilePath, 'utf8');
				newCode = newCode + loggerCode;
			} catch (error) {
				logger.error('getLoggerCode', error);
			}
		}

		const environmentString = environment && recordToString(environment);
		const cachedChecksum =
			deployFunction.checksum ??
			(await getCachedChecksum(deployFunction));
		const newChecksum = generateChecksum(newCode + environmentString);

		if (
			!deployFunction.force &&
			cachedChecksum &&
			cachedChecksum === newChecksum
		) {
			logger.info(
				chalk.green(
					`${chalk.bold(
						deployFunction.functionName,
					)} has not changed, skipping deployment`,
				),
			);
			return undefined;
		}

		deployFunction.checksum = newChecksum;
		return deployFunction;
	} catch (error) {
		logger.warn(
			chalk.yellow(
				`Error checking for local changes with ${deployFunction.functionName}.`,
			),
		);
		logger.debug(error);
		return deployFunction;
	}
};

const generateChecksum = (code: string): string => {
	return createHash(algorithm).update(code, 'utf8').digest(encoding);
};

const getCachedChecksum = async ({
	outputDirectory,
	functionName,
	flavor,
}: DeployFunctionData): Promise<string | undefined> => {
	try {
		const checksumFileName = `${functionName}.${algorithm}`;

		return await readFile(
			join(
				checksumsFolderPath({ outputDirectory, flavor }),
				checksumFileName,
			),
			'utf8',
		);
	} catch (error) {
		logger.debug(error);
		return;
	}
};

export const cacheChecksumLocal = async ({
	outputDirectory,
	checksum,
	flavor,
	functionName,
}: DeployFunctionData): Promise<void> => {
	try {
		if (!checksum) {
			return;
		}
		const checksumFileName = `${functionName}.${algorithm}`;

		await writeFile(
			join(
				checksumsFolderPath({ outputDirectory, flavor }),
				checksumFileName,
			),
			checksum,
		);
	} catch (error) {
		logger.debug(error);
	}
};
