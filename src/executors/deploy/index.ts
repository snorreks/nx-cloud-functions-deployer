import type { Executor, ExecutorContext } from '@nrwl/devkit';
import {
	mkdir,
	rm,
	// rm,
} from 'node:fs/promises';
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
	getLimiter,
	getEnvironment,
	getFlavor,
	getFirebaseProjectId,
	getAlias,
	validateProject,
} from '$utils';
import { EventEmitter } from 'events';
import {
	getOnlineChecksum,
	updateOnlineChecksum,
} from './utils/online-checksum';
import { cacheChecksumLocal, checkForChanges } from './utils/checksum';

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
	const [environment, alias] = await Promise.all([
		getEnvironment({ ...options, projectRoot, flavor }),
		getAlias({ projectRoot, workspaceRoot, tsconfig: options.tsconfig }),
		mkdir(temporaryDirectory, { recursive: true }),
		validateProject({
			packageManager,
			projectRoot,
			validate,
			tsconfig: options.tsconfig,
		}),
	]);

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
		alias,
		firebaseProjectId,
		workspaceRoot,
		projectRoot,
		outputDirectory,
		temporaryDirectory,
		flavor,
		functionsDirectory: options.functionsDirectory ?? 'src/controllers',
		packageManager,
		cloudCacheFileName: options.cloudCacheFileName ?? `functions-cache.ts`,
		defaultRegion: options.region ?? 'us-central1',
		currentTime: Math.round(new Date().getTime() / 1000),
	};
	baseDeployOptions.sentry = validateSentryEnvironments(baseDeployOptions);

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

	const [buildableFiles, onlineChecksum] = await Promise.all([
		getBuildableFiles(baseOptions),
		getOnlineChecksum(baseOptions),
	]);

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

	const isDeployableFunction = (
		deployableFunction?: DeployFunctionData,
	): deployableFunction is DeployFunctionData => !!deployableFunction;

	let deployableFunctions = (
		await Promise.all(buildableFiles.map(buildFunction))
	).filter(isDeployableFunction);

	deployableFunctions = (
		await Promise.all(buildableFiles.map(checkForChanges))
	).filter(isDeployableFunction);

	const deployableFunctionsAmount = deployableFunctions.length;

	logger.startSpinner(
		deployableFunctionsAmount,
		baseOptions.firebaseProjectId,
	);

	const limit = getLimiter<DeployFunctionData | undefined>(
		options.concurrency ?? 10,
	);
	if (deployableFunctionsAmount > 10) {
		EventEmitter.defaultMaxListeners = deployableFunctionsAmount;
	}

	const deployedFiles = (
		await Promise.all(
			deployableFunctions.map((deployableFunction) =>
				limit(() => deployFunction(deployableFunction)),
			),
		)
	)
		.filter(isDeployableFunction)
		.filter((deployableFunction) => !!deployableFunction.checksum);

	logger.endSpinner();

	const promises: Promise<void>[] =
		deployableFunctions.map(cacheChecksumLocal);

	// if (onlineChecksum) {
	promises.push(updateOnlineChecksum(deployedFiles));
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
