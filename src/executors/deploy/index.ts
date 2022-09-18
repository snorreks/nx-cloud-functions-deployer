import type { Executor, ExecutorContext } from '@nrwl/devkit';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	BaseDeployOptions,
	Flavor,
	DeployExecutorOptions,
	DeployableFileData,
} from '$types';
import { createTemporaryIndexFunctionFile } from './utils/create-deploy-index';
import { deployFunction } from './utils/deploy-function';
import { buildCloudFunctionCode } from './utils/build-function';
import {
	getDeployableFiles,
	getEnvironmentFileCode,
	getEsbuildAliasFromTsConfig,
} from './utils/read-project';
import {
	createDeployFirebaseJson,
	createDeployPackageJson,
	createEnvironmentFile,
} from './utils/create-deploy-metadata';
import { logger, getLimiter } from '$utils';
import { cacheChecksum, checkForChanges } from './utils/checksum';

const setLogSeverity = (options: DeployExecutorOptions) => {
	if (options.silent) {
		logger.setLogSeverity('silent');
		return;
	}

	if (options.verbose) {
		logger.setLogSeverity('debug');
		return;
	}
};

/**
 * Build the function and deploy with firebase-tools
 *
 * @param deployableFileData The metadata of the function to deploy
 */
const buildAndDeployFunction = async (
	deployableFileData: DeployableFileData,
): Promise<boolean> => {
	const functionName = deployableFileData.functionName;
	try {
		// start timer
		const startTime = Date.now();

		await mkdir(deployableFileData.outputRoot, { recursive: true }); // Create the output directory if it doesn't exist

		// We can do 3 things in parallel:
		// - Build the function code:
		// 		1. Create a temporary index.ts file
		//		2. Build it with esbuild
		// - Create the deploy package.json file
		// - Create the deploy firebase.json file
		await Promise.all([
			(async () => {
				const entryPointPath = await createTemporaryIndexFunctionFile(
					deployableFileData,
				);
				await buildCloudFunctionCode(
					deployableFileData,
					entryPointPath,
				);
			})(),
			createDeployPackageJson(deployableFileData),
			createDeployFirebaseJson(deployableFileData),
			createEnvironmentFile(deployableFileData),
		]);
		if (deployableFileData.dryRun) {
			logger.spinnerLog(`Dry run: ${functionName} built`);
			return true;
		}

		const [shouldDeploy, newChecksum] = await checkForChanges(
			deployableFileData,
		);

		if (!shouldDeploy && !deployableFileData.force) {
			logger.logFunctionSkipped(functionName);
			return true;
		}

		await deployFunction(deployableFileData);

		if (newChecksum) {
			await cacheChecksum(deployableFileData, newChecksum);
		}

		logger.logFunctionDeployed(functionName, Date.now() - startTime);

		return true;
	} catch (error) {
		const errorMessage = (error as { message?: string } | undefined)
			?.message;

		logger.logFunctionFailed(functionName, errorMessage);
		logger.debug(error);

		return false;
	}
};

const getBaseDeployOptions = async (
	options: DeployExecutorOptions,
	context: ExecutorContext,
): Promise<BaseDeployOptions> => {
	const { region, dryRun, tsConfig, force } = options;
	const { projectName, root: workspaceRoot, workspace } = context;

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	const flavor: Flavor = options.prod ? 'prod' : 'dev';

	const firebaseProjectId =
		flavor === 'prod'
			? options.firebaseProjectProdId
			: options.firebaseProjectDevId;

	if (!firebaseProjectId) {
		throw new Error(
			`firebaseProject${
				flavor.charAt(0).toUpperCase() + flavor.slice(1)
			}Id is required`,
		);
	}

	const relativeProjectPath = workspace.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);
	const outputDirectory =
		options.outputDirectory ??
		join(workspaceRoot, 'dist', relativeProjectPath);
	const temporaryDirectory = join(workspaceRoot, 'tmp', relativeProjectPath);

	const getAlias = async () => {
		let alias = await getEsbuildAliasFromTsConfig(projectRoot, tsConfig);
		if (!alias) {
			alias = await getEsbuildAliasFromTsConfig(
				workspaceRoot,
				'tsconfig.base.json',
			);
		}
		return alias;
	};

	const [environmentFileCode, alias] = await Promise.all([
		getEnvironmentFileCode(options, projectRoot),
		getAlias(),
		mkdir(temporaryDirectory, { recursive: true }),
	]);
	return {
		firebaseProjectId,
		workspaceRoot,
		projectRoot,
		outputDirectory,
		temporaryDirectory,
		flavor,
		dryRun,
		force,
		alias,
		environmentFileCode,
		functionsDirectory: options.functionsDirectory ?? 'src/controllers',
		packageManager: options.packageManager ?? 'pnpm',
		defaultRegion: region ?? 'us-central1',
	};
};

const executor: Executor<DeployExecutorOptions> = async (options, context) => {
	setLogSeverity(options);

	const baseDeployOptions = await getBaseDeployOptions(options, context);

	let deployableFiles = await getDeployableFiles(baseDeployOptions);

	if (options.only) {
		const onlyFunctionNames = options.only
			?.split(',')
			.map((name) => name.trim());

		deployableFiles = deployableFiles.filter((deployableFile) =>
			onlyFunctionNames.includes(deployableFile.functionName),
		);
		if (deployableFiles.length !== onlyFunctionNames.length) {
			const missingFunctionNames = onlyFunctionNames.filter(
				(name) =>
					!deployableFiles.some((file) => file.functionName === name),
			);
			logger.warn(
				`The following functions were not found: ${missingFunctionNames.join(
					', ',
				)}`,
			);
		}
	}

	logger.startSpinner(
		deployableFiles.length,
		baseDeployOptions.firebaseProjectId,
		baseDeployOptions.dryRun,
	);

	const limit = getLimiter(options.concurrency ?? 10);
	const responsesOk = await Promise.all(
		deployableFiles.map((deployableFileData) =>
			limit(() => buildAndDeployFunction(deployableFileData)),
		),
	);

	logger.endSpinner();

	return {
		success: responsesOk.every((responseOk) => responseOk) ? true : false,
	};
};

export default executor;
