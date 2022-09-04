import type { Executor } from '@nrwl/devkit';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { join } from 'node:path';
import type { EsbuildAlias } from './types';
import { createTemporaryIndexFunctionFile } from './utils/deploy-file-creator';
import { deployFunction } from './utils/deployer';
import { buildCloudFunctionCode } from './utils/esbuilder';
import {
	getDeployableFilePaths,
	getFunctionName,
	toFunctionType,
	toRelativeDeployFilePath,
} from './utils/get-deploy-metadata';
import {
	createDeployFirebaseJson,
	createDeployPackageJson,
} from './utils/output-metadata-creator';

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
	const { projectName, root: workspaceRoot, workspace } = context;
	const { alias } = options;
	const firebaseProjectId = getFirebaseProjectId(options);
	if (!projectName) {
		throw new Error('Project name is not defined');
	}

	const projectRoot = workspace.projects[projectName].root;

	const outputDirectory =
		options.outputDirectory ?? join(workspaceRoot, 'dist', projectRoot);

	const deployableFilePaths = await getDeployableFilePaths(
		join(workspaceRoot, projectRoot, 'src/controllers'),
	);

	const successfullyDeployedFunctionNames: string[] = [];

	/**
	 * Build the function and deploy with firebase-tools
	 *
	 * @param deployableFilePath The path to the function to deploy
	 */
	const buildAndDeployFunction = async (
		deployableFilePath: string,
	): Promise<void> => {
		let functionName: string | undefined;
		try {
			console.log('buildAndDeployFunction', buildAndDeployFunction);

			const relativePathToDeployFile =
				toRelativeDeployFilePath(deployableFilePath);
			functionName = await getFunctionName(deployableFilePath);
			const functionType = toFunctionType(deployableFilePath);
			const outputRoot = join(outputDirectory, functionName);

			// We can do 3 things in parallel:
			// - Build the function code:
			// 		1. Create a temporary index.ts file
			//		2. Build it with esbuild
			// - Create the deploy package.json file
			// - Create the deploy firebase.json file
			const buildPromises: Promise<void>[] = [
				(async () => {
					const inputPath = await createTemporaryIndexFunctionFile({
						deployableFilePath,
						functionName,
						functionType,
						projectRoot,
						relativePathToDeployFile,
						workspaceRoot,
					});

					await buildCloudFunctionCode({
						alias,
						inputPath,
						outputRoot,
						projectRoot,
						workspaceRoot,
					});
				})(),
				createDeployPackageJson({
					outputRoot,
					projectRoot,
					workspaceRoot,
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
			console.log(
				chalk.green(
					`Successfully deployed function ${chalk.bold(
						functionName,
					)}`,
				),
			);
		} catch (error) {
			console.log('error', error);
			if (functionName) {
				console.log(
					chalk.bold(
						`Function: ${chalk.bold(
							functionName,
						)} failed to deploy`,
					),
				);
			}
		}
	};

	const deployableFunctionsAmount = deployableFilePaths.length;

	const spinner = createSpinner(
		`Deploying ${deployableFunctionsAmount} functions...`,
	).start();

	await Promise.all(
		deployableFilePaths.map((deployableFilePath) =>
			buildAndDeployFunction(deployableFilePath),
		),
	);
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
