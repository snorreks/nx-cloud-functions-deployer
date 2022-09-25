import type { DeployFunctionData } from '$types';
import { logger } from '$utils';
import chalk from 'chalk';
import { createHash } from 'crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const algorithm = 'md5';
const checksumFileName = `checksum.${algorithm}`;
const encoding = 'hex';

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
		const { environmentFileCode, outputRoot } = deployFunction;

		const newCode = await readFile(
			join(outputRoot, 'src/index.js'),
			'utf8',
		);
		const cachedChecksum =
			deployFunction.checksum ?? (await getCachedChecksum(outputRoot));
		const newChecksum = generateChecksum(newCode + environmentFileCode);

		if (cachedChecksum && cachedChecksum === newChecksum) {
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

const getCachedChecksum = async (
	outputRoot: string,
): Promise<string | undefined> => {
	try {
		return await readFile(join(outputRoot, checksumFileName), 'utf8');
	} catch (error) {
		logger.debug(error);
		return;
	}
};

export const cacheChecksumLocal = async ({
	outputRoot,
	checksum,
}: DeployFunctionData): Promise<void> => {
	try {
		if (!checksum) {
			return;
		}

		await writeFile(join(outputRoot, checksumFileName), checksum);
	} catch (error) {
		logger.debug(error);
	}
};
