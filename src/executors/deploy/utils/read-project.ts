import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { BaseDeployOptions, BuildFunctionData } from '$types';
import { validateDeployFiles } from './typescript-parser';
import { logger, toRelativeDeployFilePath } from '$utils';
import { getDeployableFileData } from './read-source-file';
import chalk from 'chalk';

export const getDeployableFunctionPaths = async (options: {
	projectRoot: string;
	functionsDirectory: string;
}): Promise<string[]> => {
	const { projectRoot, functionsDirectory } = options;

	const functionPaths: string[] = [];
	const functionsDirectoryPath = join(projectRoot, functionsDirectory);

	const functionDirectories = await readdir(functionsDirectoryPath, {
		withFileTypes: true,
	});

	for (const directory of functionDirectories) {
		if (!directory.isDirectory()) {
			continue;
		}
		const name = directory.name;

		await recursiveGetFunctions(
			join(functionsDirectoryPath, name),
			functionPaths,
		);
	}

	return functionPaths;
};

export const getBuildableFiles = async (
	options: BaseDeployOptions,
): Promise<BuildFunctionData[]> => {
	const { functionsDirectory, only } = options;

	const functionPaths = await getDeployableFunctionPaths(options);

	const deployableFunctions = validateDeployFiles(functionPaths, options);

	if (!only) {
		for (const functionPath of functionPaths) {
			if (
				!deployableFunctions.some(
					(deployableFunction) =>
						deployableFunction.absolutePath === functionPath,
				)
			) {
				logger.warn(
					`${chalk.bold(
						toRelativeDeployFilePath(
							functionPath,
							functionsDirectory,
						),
					)} is not a valid deployable function, skipping.`,
				);
			}
		}
	}

	const isBuildableFunction = (
		buildFunction?: BuildFunctionData,
	): buildFunction is BuildFunctionData => !!buildFunction;

	const buildableFunctions = (
		await Promise.all(
			deployableFunctions.map((deployableFunction) =>
				getDeployableFileData(deployableFunction, only),
			),
		)
	).filter(isBuildableFunction);

	if (only) {
		if (only.length !== buildableFunctions.length) {
			const missingFunctionNames = only.filter(
				(name) =>
					!buildableFunctions.some(
						(file) => file.functionName === name,
					),
			);
			logger.warn(
				`${chalk.red(
					'The following functions were not found',
				)}: ${missingFunctionNames.join(', ')}`,
			);
		}
	}

	return buildableFunctions;
};

const recursiveGetFunctions = async (
	directory: string,
	functionPaths: string[],
) => {
	const files = await readdir(directory, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			await recursiveGetFunctions(
				resolve(directory, file.name),
				functionPaths,
			);
		} else {
			const path = resolve(directory, file.name);
			if (path.endsWith('.ts')) {
				functionPaths.push(path.replaceAll('\\', '/'));
			}
		}
	}
};
