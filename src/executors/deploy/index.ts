import type { Executor, ExecutorContext } from '@nrwl/devkit';
import { mkdir } from 'node:fs/promises';
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
	getDeployableFiles,
	getEnvironmentFileCode,
	getEsbuildAliasFromTsConfig,
	validateProject,
} from './utils/read-project';
import { logger, getLimiter } from '$utils';
import { EventEmitter } from 'events';

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
			options.tsConfig,
		);
		if (!alias) {
			alias = await getEsbuildAliasFromTsConfig(
				workspaceRoot,
				'tsconfig.base.json',
			);
		}
		return alias;
	};
	const packageManager = options.packageManager ?? 'pnpm';

	const [environmentFileCode, alias] = await Promise.all([
		getEnvironmentFileCode(options, projectRoot),
		getAlias(),
		mkdir(temporaryDirectory, { recursive: true }),
		validateProject({
			packageManager,
			projectRoot,
			tsConfig: options.tsConfig,
		}),
	]);

	return {
		...options,
		environmentFileCode,
		alias,
		firebaseProjectId,
		workspaceRoot,
		projectRoot,
		outputDirectory,
		temporaryDirectory,
		flavor,
		functionsDirectory: options.functionsDirectory ?? 'src/controllers',
		packageManager,
		defaultRegion: options.region ?? 'us-central1',
	};
};

const executor: Executor<DeployExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);
	const { only } = options;
	const baseOptions = await getBaseOptions(options, context);

	let buildableFiles = await getDeployableFiles(baseOptions);

	if (only) {
		const onlyFunctionNames = only?.split(',').map((name) => name.trim());

		buildableFiles = buildableFiles.filter((deployableFunction) =>
			onlyFunctionNames.includes(deployableFunction.functionName),
		);
		if (buildableFiles.length !== onlyFunctionNames.length) {
			const missingFunctionNames = onlyFunctionNames.filter(
				(name) =>
					!buildableFiles.some((file) => file.functionName === name),
			);
			logger.warn(
				`The following functions were not found: ${missingFunctionNames.join(
					', ',
				)}`,
			);
		}
	}

	const deployableFunctions = (
		await Promise.all(buildableFiles.map(buildFunction))
	).filter(
		(deployableFunction): deployableFunction is DeployFunctionData =>
			!!deployableFunction,
	);

	const deployableFunctionsAmount = deployableFunctions.length;

	logger.startSpinner(
		deployableFunctionsAmount,
		baseOptions.firebaseProjectId,
		baseOptions.dryRun,
	);

	const limit = getLimiter(options.concurrency ?? 10);
	if (deployableFunctionsAmount > 10) {
		EventEmitter.defaultMaxListeners = deployableFunctionsAmount;
	}

	const responsesOk = await Promise.all(
		deployableFunctions.map((deployableFunction) =>
			limit(() => deployFunction(deployableFunction)),
		),
	);

	logger.endSpinner();

	return {
		success: responsesOk.every((responseOk) => responseOk) ? true : false,
	};
};

export default executor;
