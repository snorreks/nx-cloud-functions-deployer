import type { Executor } from '@nrwl/devkit';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { EsbuildAlias, LogLevel, DeployableFileLiteData } from '$types';
import { createTemporaryIndexFunctionFile } from './utils/create-deploy-index';
import { deployFunction } from './utils/deploy-function';
import { buildCloudFunctionCode } from './utils/build-function';
import {
	getEsbuildAliasFromTsConfig,
	getDeployableFilePaths,
} from './utils/read-project';
import {
	createDeployFirebaseJson,
	createDeployPackageJson,
} from './utils/create-deploy-metadata';
import {
	getDeployableFileData,
	toRelativeDeployFilePath,
} from './utils/read-source-file';
import { getDeployableFiles } from './utils/typescript-parser';

export interface ExecutorOptions {
	firebaseProjectId?: string;
	firebaseProjectProdId?: string;
	firebaseProjectDevId?: string;
	entryPoints?: string[];
	outputDirectory?: string;
	tsConfigPath?: string;
	alias?: EsbuildAlias;
	prod?: boolean;
	dev?: boolean;
	region?: string;
}

const getFirebaseProjectId = (options: ExecutorOptions): string => {
	if (options.firebaseProjectId) {
		return options.firebaseProjectId;
	}
	if (options.prod) {
		if (!options.firebaseProjectProdId) {
			throw new Error('firebaseProjectProdId is required');
		}
		return options.firebaseProjectProdId;
	}
	if (options.dev) {
		if (!options.firebaseProjectDevId) {
			throw new Error('firebaseProjectDevId is required');
		}
		return options.firebaseProjectDevId;
	}
	throw new Error('firebaseProjectId is required');
};

const executor: Executor<ExecutorOptions> = async (options, context) => {
	const { region } = options;
	const { projectName, root: workspaceRoot, workspace, isVerbose } = context;
	const firebaseProjectId = getFirebaseProjectId(options);
	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	const logLevel: LogLevel = isVerbose ? 'info' : 'silent';
	const log = (message?: unknown, ...optionalParams: unknown[]): void => {
		if (logLevel !== 'silent') {
			console.log(message, optionalParams);
		}
	};

	const projectRoot = workspace.projects[projectName].root;

	const outputDirectory =
		options.outputDirectory ?? join(workspaceRoot, 'dist', projectRoot);

	const deployableFilePaths = (
		await getDeployableFilePaths(
			join(workspaceRoot, projectRoot, 'src/controllers'),
		)
	).splice(0, 1);

	const deployableFiles = getDeployableFiles(deployableFilePaths);

	const successfullyDeployedFunctionNames: string[] = [];
	const failedDeployedFunctionNames: string[] = [];

	const temporaryDirectory = join(workspaceRoot, 'tmp', projectRoot);

	await mkdir(outputDirectory, { recursive: true });
	await mkdir(temporaryDirectory, { recursive: true });
	let baseAlias = await getEsbuildAliasFromTsConfig(
		join(workspaceRoot, projectRoot),
	);
	if (!baseAlias) {
		baseAlias = await getEsbuildAliasFromTsConfig(
			workspaceRoot,
			'tsconfig.base.json',
		);
	}
	const alias = {
		...baseAlias,
		...options.alias,
	};
	log('alias', alias);
	const defaultRegion = region ?? 'us-central1';
	log('defaultRegion', defaultRegion);
	const getRemainingFunctionsAmount = (): number => {
		const functionsAmount = deployableFiles.length;
		const successfullyDeployedFunctionsAmount =
			successfullyDeployedFunctionNames.length;
		const failedDeployedFunctionsAmount =
			failedDeployedFunctionNames.length;
		return (
			functionsAmount -
			successfullyDeployedFunctionsAmount -
			failedDeployedFunctionsAmount
		);
	};

	/**
	 * Build the function and deploy with firebase-tools
	 *
	 * @param deployableFileData The metadata of the function to deploy
	 */
	const buildAndDeployFunction = async (
		deployableFileLiteData: DeployableFileLiteData,
	): Promise<void> => {
		try {
			const deployableFileData = await getDeployableFileData(
				deployableFileLiteData,
			);

			const { functionName, deployOptions } = deployableFileData;
			const outputRoot = join(outputDirectory, functionName);
			const region = deployOptions?.region ?? defaultRegion;
			// We can do 3 things in parallel:
			// - Build the function code:
			// 		1. Create a temporary index.ts file
			//		2. Build it with esbuild
			// - Create the deploy package.json file
			// - Create the deploy firebase.json file
			const buildPromises: Promise<void>[] = [
				(async () => {
					const inputPath = await createTemporaryIndexFunctionFile({
						deployableFileData,
						region,
						temporaryDirectory,
					});

					await buildCloudFunctionCode({
						alias,
						inputPath,
						outputRoot,
						projectRoot,
						workspaceRoot,
						logLevel: logLevel === 'silent' ? 'silent' : 'info',
						// external: ['nx-cloud-functions-deployer'],
					});
				})(),
				createDeployPackageJson({
					outputRoot,
				}),
				createDeployFirebaseJson({
					outputRoot,
				}),
			];

			await Promise.all(buildPromises);
			await deployFunction({
				firebaseProjectId,
				functionName,
				outputRoot,
			});

			successfullyDeployedFunctionNames.push(functionName);
			spinner.stop({
				text: chalk.green(
					`Successfully deployed function ${chalk.bold(
						functionName,
					)}`,
				),
			});
			spinner.start({
				text: `Deploying ${chalk.bold(
					getRemainingFunctionsAmount(),
				)} Functions...`,
			});
		} catch (error) {
			const errorMessage = (error as { message?: string } | undefined)
				?.message;

			spinner.stop({
				text: chalk.red(
					`Function: ${chalk.bold(
						toRelativeDeployFilePath(
							deployableFileLiteData.absolutePath,
						),
					)} failed to deploy${
						errorMessage ? `: ${errorMessage}` : ''
					}`,
				),
			});

			spinner.start({
				text: `Deploying ${chalk.bold(
					getRemainingFunctionsAmount(),
				)} Functions...`,
			});
		}
	};

	const deployableFunctionsAmount = deployableFiles.length;

	// if (deployableFunctionsAmount) {
	// 	return { success: true };
	// }

	const spinner = createSpinner(
		`Deploying ${chalk.bold(getRemainingFunctionsAmount())} Functions...`,
	).start();

	await Promise.all(deployableFiles.map(buildAndDeployFunction));

	if (
		successfullyDeployedFunctionNames.length === deployableFunctionsAmount
	) {
		spinner.success({
			text: chalk.green(
				`Successfully deployed ${chalk.bold(
					deployableFunctionsAmount,
				)} functions!`,
			),
		});
		return {
			success: true,
		};
	}

	const failedDeployedFunctionAmount =
		deployableFunctionsAmount - successfullyDeployedFunctionNames.length;
	spinner.error({
		text: chalk.red(
			`Failed to deploy ${chalk.bold(
				failedDeployedFunctionAmount,
			)} functions!`,
		),
	});

	return {
		success: false,
	};
};

export default executor;
