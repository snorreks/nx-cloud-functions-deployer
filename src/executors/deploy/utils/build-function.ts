import { join } from 'node:path';
import { executeEsbuild, logger } from '$utils';
import type { BuildFunctionData, DeployFunctionData } from '$types';
import {
	copyAssets,
	createDeployFirebaseJson,
	createDeployPackageJson,
	createEnvironmentFile,
} from './create-deploy-metadata';
import { mkdir } from 'node:fs/promises';
import { createTemporaryIndexFunctionFile } from './create-deploy-index';

/**
 * Build the function with esbuild
 *
 * @param buildFunctionData The metadata of the function to deploy
 */
export const buildFunction = async (
	buildFunctionData: BuildFunctionData,
): Promise<DeployFunctionData | undefined> => {
	const functionName = buildFunctionData.functionName;
	try {
		await mkdir(buildFunctionData.outputRoot, { recursive: true }); // Create the output directory if it doesn't exist

		// We can do 3 things in parallel:
		// - Build the function code:
		// 		1. Create a temporary index.ts file
		//		2. Build it with esbuild
		// - Create the deploy package.json file
		// - Create the deploy firebase.json file
		await Promise.all([
			(async () => {
				const inputPath = await createTemporaryIndexFunctionFile(
					buildFunctionData,
				);
				const outputPath = join(
					buildFunctionData.outputRoot,
					'src/index.js',
				);

				const shouldImportLogger = await buildLoggerFile(
					buildFunctionData,
				);
				if (shouldImportLogger) {
					buildFunctionData.hasLoggerFile = true;
				}

				await executeEsbuild({
					inputPath,
					outputPath,
					nodeVersion: buildFunctionData.nodeVersion,
					keepNames: buildFunctionData.keepNames,
					alias: buildFunctionData.alias,
					external: buildFunctionData.external,
					sourceRoot: buildFunctionData.workspaceRoot,
					footer: shouldImportLogger
						? 'import "./logger.js";'
						: undefined,
					requireFix: true,
					sourcemap: true,
				});
				await createEnvironmentFile(buildFunctionData);
			})(),
			copyAssets(buildFunctionData),
			createDeployPackageJson(buildFunctionData),
			createDeployFirebaseJson(buildFunctionData),
		]);
		if (buildFunctionData.dryRun) {
			logger.spinnerLog(`Dry run: ${functionName} built`);
			logger.logFunctionDeployed(
				functionName,
				Date.now() - buildFunctionData.startTime,
			);
			return undefined;
		}

		return buildFunctionData;
	} catch (error) {
		const errorMessage = (error as { message?: string } | undefined)
			?.message;
		logger.logFunctionFailed(functionName, errorMessage);
		logger.debug(error);
		return undefined;
	}
};

const buildLoggerFile = async (
	buildFunctionData: BuildFunctionData,
): Promise<boolean> => {
	try {
		const inputPath = join(
			buildFunctionData.projectRoot,
			buildFunctionData.includeFilePath ?? 'src/logger.ts',
		);
		const outputPath = join(buildFunctionData.outputRoot, 'src/logger.js');

		await executeEsbuild({
			inputPath,
			outputPath,
			keepNames: buildFunctionData.keepNames,
			alias: buildFunctionData.alias,
			external: buildFunctionData.external,
			sourceRoot: buildFunctionData.workspaceRoot,
			nodeVersion: buildFunctionData.nodeVersion,
			requireFix: buildFunctionData.requireFix,
			sourcemap: buildFunctionData.sourcemap,
		});

		return true;
	} catch (error) {
		logger.debug('buildLoggerFile', error);
		return false;
	}
};
