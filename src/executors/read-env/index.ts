import type { Executor } from '@nx/devkit';
import type { ExecutorBaseOptions } from '$types';
import { getEnvironmentFileName, getFlavor, logger } from '$utils';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { copy } from 'copy-paste';
interface ReadEnvExecutorOptions extends ExecutorBaseOptions {
	flavor?: string;
	flavors: Record<string, string>;
	envFiles?: Record<string, string>;
}

const copyToClipboard = async (text: string) => {
	try {
		await new Promise<void>((resolve, reject) => {
			copy(text, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
		return true;
	} catch (error) {
		return false;
	}
};

const readAndSortEnvFile = async (filePath: string): Promise<string> => {
	// Read the file
	const data = await readFile(filePath, 'utf8');

	// Split into lines and filter out any lines that don't contain '='
	const lines = data.split('\n').filter((line) => line.includes('='));

	// Split each line into [key, value] pairs
	const pairs = lines.map((line) => line.split('='));

	// Sort the pairs by key
	const sortedPairs = pairs.sort((a, b) => a[0].localeCompare(b[0]));

	// Convert to an object
	const sortedObject = Object.fromEntries(sortedPairs);

	// Convert to a JSON string
	const jsonString = JSON.stringify(sortedObject);

	return jsonString;
};

const executor: Executor<ReadEnvExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const { projectName, root: workspaceRoot, workspace } = context;

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!workspace) {
		throw new Error('Workspace is not defined');
	}
	const flavor = getFlavor(options);
	const environmentFileName = getEnvironmentFileName({
		flavor,
		envFiles: options.envFiles,
	});
	const relativeProjectPath = workspace.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);

	const envPath = join(projectRoot, environmentFileName);

	const env = await readAndSortEnvFile(envPath);

	const output = `'${env}'`;

	await copyToClipboard(output);

	console.log(`'${env}'`);

	return {
		success: true,
	};
};

export default executor;
