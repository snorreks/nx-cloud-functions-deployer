import type { Executor, ExecutorContext } from '@nrwl/devkit';
import {
	mkdir,
	rm,
	// rm,
} from 'node:fs/promises';
import { join } from 'node:path';
import type {
	BaseDeployOptions,
	Flavor,
	DeployExecutorOptions,
	DeployFunctionData,
} from '$types';
import { deployFunction } from './utils/deploy-function';
import { buildFunction } from './utils/build-function';
import {
	getBuildableFiles,
	getEsbuildAliasFromTsConfig,
	validateProject,
} from './utils/read-project';
import { logger, getLimiter, getEnvironment } from '$utils';
import { EventEmitter } from 'events';
import {
	getOnlineChecksum,
	updateOnlineChecksum,
} from './utils/online-checksum';
import { cacheChecksumLocal, checkForChanges } from './utils/checksum';

const getBaseOptions = async (
	options: DeployExecutorOptions,
	context: ExecutorContext,
): Promise<BaseDeployOptions> => {
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
		let alias = await getEsbuildAliasFromTsConfig(
			projectRoot,
			options.tsconfig,
		);
		if (!alias) {
			if (options.tsconfig && options.tsconfig !== 'tsconfig.json') {
				alias = await getEsbuildAliasFromTsConfig(
					projectRoot,
					'tsconfig.json',
				);
			}
			if (!alias) {
				alias = await getEsbuildAliasFromTsConfig(
					workspaceRoot,
					'tsconfig.base.json',
				);
			}
		}
		return alias;
	};
	const packageManager = options.packageManager ?? 'pnpm';
	const validate = options.validate ?? false;
	const [environment, alias] = await Promise.all([
		getEnvironment({ ...options, projectRoot }),
		getAlias(),
		mkdir(temporaryDirectory, { recursive: true }),
		validateProject({
			packageManager,
			projectRoot,
			validate,
			tsconfig: options.tsconfig,
		}),
	]);
	const only = options.only?.split(',').map((name) => name.trim());

	return {
		ignoreMissingEnvironmentKey:
			options.ignoreMissingEnvironmentKey ?? true, // TODO: Change to false in v2
		dryRun: options.dryRun,
		force: options.force,
		only,
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
		cloudCacheFileName:
			options.cloudCacheFileName ?? `functions-cache.${flavor}.ts`,
		defaultRegion: options.region ?? 'us-central1',
	};
};

const executor: Executor<DeployExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);
	const baseOptions = await getBaseOptions(options, context);

	const buildableFiles = await getBuildableFiles(baseOptions);

	const onlineChecksum = await getOnlineChecksum(baseOptions);

	if (onlineChecksum) {
		for (const [functionName, checksum] of Object.entries(onlineChecksum)) {
			const deployableFunction = buildableFiles.find(
				(file) => file.functionName === functionName,
			);
			if (deployableFunction) {
				deployableFunction.checksum = checksum;
			}
		}
	} else {
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

	if (onlineChecksum) {
		await updateOnlineChecksum(deployedFiles);
	} else {
		await Promise.all(deployableFunctions.map(cacheChecksumLocal));
	}

	if (!options.debug) {
		try {
			await rm(baseOptions.temporaryDirectory, { recursive: true });
		} catch (error) {
			logger.warn('Could not delete temporary directory');
			logger.debug(error);
		}
	}

	logger.endSpinner();

	return {
		success: !logger.hasFailedFunctions,
	};
};

export default executor;
