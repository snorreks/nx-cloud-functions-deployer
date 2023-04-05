import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	BaseDeployOptions,
	FunctionsCache,
	DeployFunctionData,
} from '$types';
import { logger, toImportPath, runFile } from '$utils';

const readFileName = 'read.ts';
const updateFileName = 'update.ts';
const jsonFileName = 'checksum.json';

export const createExecutePackageJson = async (directory: string) => {
	const packageJson = {
		type: 'commonjs',
	};

	await writeFile(
		join(directory, 'package.json'),
		JSON.stringify(packageJson, undefined, 2),
	);
};

export const getOnlineChecksum = async (
	options: BaseDeployOptions,
): Promise<FunctionsCache | undefined> => {
	const {
		projectRoot,
		temporaryDirectory,
		cloudCacheFileName,
		force,
		environment,
	} = options;
	logger.debug('getOnlineChecksum', {
		projectRoot,
		temporaryDirectory,
		cloudCacheFileName,
		force,
	});

	try {
		if (force) {
			logger.log('Force deploy, skipping online checksum');
			return;
		}
		const fetchFilePath = join(projectRoot, cloudCacheFileName);
		const fetchExecuteFilePath = join(temporaryDirectory, readFileName);

		const jsonFilePath = join(temporaryDirectory, jsonFileName);

		const executeFetchFileCode = toExecuteFetchCode({
			fetchFilePath,
			flavor: options.flavor,
			executeDirectory: temporaryDirectory,
		});
		await Promise.all([
			writeFile(fetchExecuteFilePath, executeFetchFileCode),
			createExecutePackageJson(temporaryDirectory),
		]);

		await runFile({
			cwd: temporaryDirectory,
			runScriptFilePath: fetchExecuteFilePath,
			environment,
		});

		const onlineChecksumJson = await readFile(jsonFilePath, 'utf-8');

		const onlineChecksum = JSON.parse(onlineChecksumJson) as FunctionsCache;

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
		const filesWithChecksum = deployedFiles.filter(
			({ checksum }) => !!checksum,
		);

		const firstDeployedFile = filesWithChecksum[0];
		if (!firstDeployedFile) {
			return;
		}
		const {
			projectRoot,
			temporaryDirectory,
			cloudCacheFileName,
			environment,
		} = firstDeployedFile;

		const updateFilePath = join(projectRoot, cloudCacheFileName);
		const executeUpdateFilePath = join(temporaryDirectory, updateFileName);

		const onlineChecksum = filesWithChecksum.reduce<FunctionsCache>(
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
			flavor: firstDeployedFile.flavor,
			executeDirectory: temporaryDirectory,
		});

		logger.info('Updating online checksum');

		await Promise.all([
			writeFile(executeUpdateFilePath, executeUpdateFileCode),
			createExecutePackageJson(temporaryDirectory),
		]);

		await runFile({
			cwd: temporaryDirectory,
			runScriptFilePath: executeUpdateFilePath,
			environment,
		});
	} catch (error) {
		logger.warn('Failed to update online checksum');
		logger.debug(error);
	}
};

const toExecuteFetchCode = ({
	fetchFilePath,
	flavor,
	executeDirectory,
}: {
	fetchFilePath: string;
	flavor: string;
	executeDirectory: string;
}): string => {
	return `
        import { fetch } from '${toImportPath(fetchFilePath, executeDirectory)}'
        import { writeFile } from 'node:fs/promises';
        
        const execute = async () => {
            const code = await fetch({ flavor: '${flavor}'});
            await writeFile('${jsonFileName}', JSON.stringify(code ?? {}, null, 2));
        }

        execute();
    `;
};

const toExecuteUpdateCode = ({
	updateFilePath,
	newOnlineChecksum,
	flavor,
	executeDirectory,
}: {
	updateFilePath: string;
	newOnlineChecksum: FunctionsCache;
	flavor: string;
	executeDirectory: string;
}): string => {
	let executeUpdateCode = `
        import { update } from '${toImportPath(
			updateFilePath,
			executeDirectory,
		)}'
        update({
			flavor: '${flavor}',
			newFunctionsCache: {
    `;
	for (const [functionName, checksum] of Object.entries(newOnlineChecksum)) {
		executeUpdateCode += `'${functionName}': '${checksum}',`;
	}
	executeUpdateCode += `
        	}
		});
    `;

	return executeUpdateCode;
};
