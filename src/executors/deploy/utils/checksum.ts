import type { DeployableFileData } from '$types';
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
 * @param outputRoot The output root directory of the function
 * @returns if the first element is true, then the function should be deployed
 */
export const checkForChanges = async ({
	outputRoot,
	functionName,
}: DeployableFileData): Promise<[boolean, string] | [boolean]> => {
	try {
		const newCode = await readFile(
			join(outputRoot, 'src/index.js'),
			'utf8',
		);
		const cachedChecksum = await getCachedChecksum(outputRoot);
		const newChecksum = generateChecksum(newCode);
		if (cachedChecksum && cachedChecksum === newChecksum) {
			return [false];
		}

		return [true, newChecksum];
	} catch (error) {
		logger.warn(
			chalk.yellow(`Error checking for changes for ${functionName}.`),
		);
		logger.debug(error);
		return [true];
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

export const cacheChecksum = async (
	{ outputRoot }: DeployableFileData,
	newChecksum: string,
): Promise<void> => {
	try {
		await writeFile(join(outputRoot, checksumFileName), newChecksum);
	} catch (error) {
		logger.debug(error);
	}
};
