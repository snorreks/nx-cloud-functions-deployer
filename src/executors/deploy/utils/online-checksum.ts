import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BaseDeployOptions, CloudCache, DeployFunctionData } from '$types';
import { executeTypescriptFile, logger } from '$utils';
import { platform } from 'node:os';

const readFileName = 'read.ts';
const updateFileName = 'update.ts';
const jsonFileName = 'checksum.json';

export const getOnlineChecksum = async ({
	projectRoot,
	temporaryDirectory,
	cloudCacheFileName,
}: BaseDeployOptions): Promise<CloudCache | undefined> => {
	try {
		const fetchFilePath = join(projectRoot, cloudCacheFileName);
		const fetchExecuteFilePath = join(temporaryDirectory, readFileName);

		const jsonFilePath = join(temporaryDirectory, jsonFileName);

		const executeFetchFileCode = toExecuteFetchCode({
			jsonFilePath,
			fetchFilePath,
		});

		await writeFile(fetchExecuteFilePath, executeFetchFileCode);

		await executeTypescriptFile({
			cwd: temporaryDirectory,
			typescriptFilePath: fetchExecuteFilePath,
		});

		const onlineChecksumJson = await readFile(jsonFilePath, 'utf-8');

		const onlineChecksum = JSON.parse(onlineChecksumJson) as CloudCache;

		return onlineChecksum;
	} catch (error) {
		logger.error(error);
		return;
	}
};

export const updateOnlineChecksum = async (
	deployedFiles: DeployFunctionData[],
) => {
	try {
		const firstDeployedFile = deployedFiles[0];
		if (!firstDeployedFile) {
			return;
		}
		const { projectRoot, temporaryDirectory, cloudCacheFileName } =
			firstDeployedFile;

		const updateFilePath = join(projectRoot, cloudCacheFileName);
		const executeUpdateFilePath = join(temporaryDirectory, updateFileName);

		const onlineChecksum = deployedFiles
			.filter(({ checksum }) => !!checksum)
			.reduce<CloudCache>(
				(acc, { functionName, checksum }) => ({
					...acc,
					[functionName]: checksum as string,
				}),
				{},
			);

		logger.debug('Updating online checksum', onlineChecksum);

		const executeUpdateFileCode = toExecuteUpdateCode({
			updateFilePath,
			newOnlineChecksum: onlineChecksum,
		});

		await writeFile(executeUpdateFilePath, executeUpdateFileCode);

		await executeTypescriptFile({
			cwd: temporaryDirectory,
			typescriptFilePath: executeUpdateFilePath,
		});
	} catch (error) {
		logger.warn('Failed to update online checksum');
		logger.debug(error);
	}
};

const toExecuteFetchCode = ({
	fetchFilePath,
	jsonFilePath,
}: {
	fetchFilePath: string;
	jsonFilePath: string;
}): string => {
	return `
        import { fetch } from '${toImportPath(fetchFilePath)}'
        import { writeFile } from 'node:fs/promises';
        
        const execute = async () => {
            const code = await fetch();
            await writeFile('${jsonFilePath.replaceAll(
				'\\',
				'/',
			)}', JSON.stringify(code ?? {}, null, 2));
        }

        execute();
    `;
};

const toExecuteUpdateCode = ({
	updateFilePath,
	newOnlineChecksum,
}: {
	updateFilePath: string;
	newOnlineChecksum: CloudCache;
}): string => {
	let executeUpdateCode = `
        import { update } from '${toImportPath(updateFilePath)}'
        update({
    `;

	for (const [functionName, checksum] of Object.entries(newOnlineChecksum)) {
		executeUpdateCode += `'${functionName}': '${checksum}',`;
	}

	executeUpdateCode += `
        });
    `;

	return executeUpdateCode;
};

const toImportPath = (typescriptFilePath: string): string => {
	const importPath = typescriptFilePath
		.replace('.ts', '')
		.replaceAll('\\', '/');

	if (platform() === 'win32') {
		return `file://${importPath}`;
	}

	return importPath;
};
