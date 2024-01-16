import type { Executor, ExecutorContext } from '@nx/devkit';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	BaseDeployOptions,
	DeployExecutorOptions,
	DeployFunctionData,
	SentryLiteData,
} from '$types';
import { deployFunction } from './utils/deploy-function';
import { buildFunction } from './utils/build-function';
import { getBuildableFiles } from './utils/read-project';
import {
	logger,
	runFunctions,
	getEnvironment,
	getFlavor,
	getFirebaseProjectId,
	validateProject,
} from '$utils';
import {
	getOnlineChecksum,
	updateOnlineChecksum,
} from './utils/online-checksum';
import {
	cacheChecksumLocal,
	checkForChanges,
	checksumsFolderPath,
} from './utils/checksum';

export const isDeployableFunction = (
	deployableFunction?: DeployFunctionData,
): deployableFunction is DeployFunctionData => !!deployableFunction;

const redeployFailedFunctions = async (options: {
	deployedFiles: DeployFunctionData[];
	failedFunctions: DeployFunctionData[];
	retryAmount?: number;
	retryConcurrency?: number;
	firebaseProjectId: string;
}) => {
	const { deployedFiles, retryAmount, firebaseProjectId } = options;
	let { failedFunctions } = options;
	if (!retryAmount) {
		return;
	}
	// Stop the initial spinner before starting the retry process
	logger.endSpinner();

	// Print out the number of successful and failed functions
	const successCount = deployedFiles.length;
	const failedCount = failedFunctions.length;
	logger.log(
		`Deployment completed with ${successCount} successful and ${failedCount} failed functions.`,
	);
	logger.log('Starting retries for failed functions...');

	// Start a new spinner specifically for the retries
	logger.startSpinner(failedCount, firebaseProjectId);

	for (let i = 0; i < retryAmount; i++) {
		const successfullyRedeployedFunctions = (
			await runFunctions(
				failedFunctions.map(
					(deployableFunction) => () =>
						deployFunction(deployableFunction),
				),
				options.retryConcurrency ?? 1,
			)
		).filter(isDeployableFunction);

		failedFunctions = failedFunctions.filter(
			(failedFunction) =>
				!successfullyRedeployedFunctions.some(
					(redeployedFunction) =>
						redeployedFunction.functionName ===
						failedFunction.functionName,
				),
		);

		deployedFiles.push(...successfullyRedeployedFunctions);
		// if all failed functions were redeployed, break the loop
		if (failedFunctions.length === 0) {
			return;
		}
	}
};

export const getBaseOptions = async (
	options: DeployExecutorOptions,
	context: ExecutorContext,
): Promise<BaseDeployOptions> => {
	const { projectName, root: workspaceRoot, workspace } = context;
	logger.debug('getBaseOptions', options);

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!workspace) {
		throw new Error('Workspace is not defined');
	}

	const flavor = getFlavor(options);

	const firebaseProjectId = getFirebaseProjectId({
		flavors: options.flavors,
		flavor,
	});

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

	const packageManager = options.packageManager ?? 'pnpm';
	const validate = options.validate ?? false;
	const [environment] = await Promise.all([
		getEnvironment({ ...options, projectRoot, flavor }),
		mkdir(temporaryDirectory, { recursive: true }),
		mkdir(
			checksumsFolderPath({
				outputDirectory,
				flavor,
			}),
			{
				recursive: true,
			},
		),
		validateProject({
			packageManager,
			projectRoot,
			validate,
			tsconfig: options.tsconfig,
		}),
	]);

	logger.debug('---environment', environment);

	const only = options.only?.split(',').map((name) => name.trim());

	const baseDeployOptions: BaseDeployOptions = {
		...options,
		nodeVersion: options.nodeVersion,
		ignoreMissingEnvironmentKey:
			options.ignoreMissingEnvironmentKey ?? true, // TODO: Change to false in v2
		dryRun: options.dryRun,
		force: options.force,
		only,
		includeFilePath: options.includeFilePath ?? 'src/logger.ts',
		tsconfig: options.tsconfig,
		region: options.region,
		validate: options.validate,
		environment,
		firebaseProjectId,
		workspaceRoot,
		projectRoot,
		minify: options.minify,
		outputDirectory,
		temporaryDirectory,
		flavor,
		functionsDirectory: options.functionsDirectory ?? 'src/controllers',
		packageManager,
		cloudCacheFileName: options.cloudCacheFileName ?? `functions-cache.ts`,
		defaultRegion: options.region ?? 'us-central1',
		currentTime: Math.round(new Date().getTime() / 1000),
	};
	if (options.deploySentry) {
		baseDeployOptions.sentry =
			validateSentryEnvironments(baseDeployOptions);
	}

	return baseDeployOptions;
};

const validateSentryEnvironments = (
	baseDeployOptions: BaseDeployOptions,
): SentryLiteData | undefined => {
	const { environment } = baseDeployOptions;
	if (!environment) {
		return;
	}

	const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = environment;

	if (SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT) {
		logger.log('Sentry environments are defined, uploading sourcemaps');
		return {
			token: SENTRY_AUTH_TOKEN,
			organization: SENTRY_ORG,
			project: SENTRY_PROJECT,
		};
	}

	if (!SENTRY_AUTH_TOKEN && !SENTRY_ORG && !SENTRY_PROJECT) {
		return;
	}

	if (!SENTRY_AUTH_TOKEN) {
		logger.warn(
			'SENTRY_AUTH_TOKEN is not defined in environment, skipping upload sourcemaps',
		);
	}
	if (!SENTRY_ORG) {
		logger.warn(
			'SENTRY_ORG is not defined in environment, skipping upload sourcemaps',
		);
	}
	if (!SENTRY_PROJECT) {
		logger.warn(
			'SENTRY_PROJECT is not defined in environment, skipping upload sourcemaps',
		);
	}
	return;
};

const executor: Executor<DeployExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);
	const baseOptions = await getBaseOptions(options, context);
	logger.debug('baseOptions', baseOptions);

	const [buildableFiles, onlineChecksum] = await Promise.all([
		getBuildableFiles(baseOptions),
		getOnlineChecksum(baseOptions),
	]);

	const concurrency = options.concurrency ?? 5;

	if (onlineChecksum) {
		for (const [functionName, checksum] of Object.entries(onlineChecksum)) {
			const deployableFunction = buildableFiles.find(
				(file) => file.functionName === functionName,
			);
			if (deployableFunction) {
				deployableFunction.checksum = checksum;
			}
		}
	} else if (!options.force) {
		logger.info('No online checksum found');
	}

	let deployableFunctions = (
		await runFunctions(
			buildableFiles.map(
				(buildableFile) => () => buildFunction(buildableFile),
			),
			concurrency,
		)
	).filter(isDeployableFunction);

	deployableFunctions = (
		await runFunctions(
			deployableFunctions.map(
				(buildableFile) => () => checkForChanges(buildableFile),
			),
			concurrency,
		)
	).filter(isDeployableFunction);

	const deployableFunctionsAmount = deployableFunctions.length;

	logger.startSpinner(
		deployableFunctionsAmount,
		baseOptions.firebaseProjectId,
	);

	const deployedFiles = (
		await runFunctions(
			deployableFunctions.map(
				(deployableFunction) => () =>
					deployFunction(deployableFunction),
			),
			concurrency,
		)
	).filter(isDeployableFunction);

	// check if there are any functions that failed to deploy
	if (deployableFunctionsAmount !== deployedFiles.length) {
		await redeployFailedFunctions({
			deployedFiles,
			failedFunctions: deployableFunctions.filter(
				(deployableFunction) =>
					!deployedFiles.find(
						(deployedFile) =>
							deployedFile.functionName ===
							deployableFunction.functionName,
					),
			),
			retryAmount: options.retryAmount,
			firebaseProjectId: baseOptions.firebaseProjectId,
		});
	}

	logger.endSpinner();

	const deployedFilesToUpdateChecksum = deployedFiles.filter(
		(deployableFunction) => !!deployableFunction.checksum,
	);

	const promises: Promise<void>[] =
		deployedFilesToUpdateChecksum.map(cacheChecksumLocal);

	// if (onlineChecksum) {
	promises.push(updateOnlineChecksum(deployedFilesToUpdateChecksum));
	// }
	await Promise.all(promises);

	if (!options.debug) {
		logger.log('Cleaning up...');
		try {
			await rm(baseOptions.temporaryDirectory, { recursive: true });
		} catch (error) {
			logger.warn('Could not delete temporary directory');
			logger.debug(error);
		}
	}

	return {
		success: !logger.hasFailedFunctions,
	};
};

export default executor;
