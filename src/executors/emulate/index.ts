import type { Executor } from '@nx/devkit';
import { join } from 'node:path';
import type { PackageManager } from '$types';
import {
	logger,
	getFlavor,
	getFirebaseProjectId,
	execute,
	runFunctions,
} from '$utils';
import { getBaseOptions, isDeployableFunction } from '../deploy';
import { getBuildableFiles } from '../deploy/utils/read-project';
import { buildFunction } from '../deploy/utils/build-function';
import { writeFile } from 'node:fs/promises';

interface EmulateOptions {
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;
	flavors: Record<string, string>;
	/** The flavor of the project */
	flavor?: string;

	minify: boolean;

	packageManager: PackageManager;

	firebaseJsonPath?: string;

	only?: string[];

	/**
	 * The amount of functions to deploy in parallel
	 *
	 * @default 5
	 */
	concurrency?: number;
}

const executor: Executor<EmulateOptions> = async (options, context) => {
	logger.setLogSeverity(options);
	logger.debug('getBaseOptions', options);

	const baseOptions = await getBaseOptions(
		{
			...options,
			useLogger: false,
			only: undefined,
			cloudCacheFileName: '',
		},
		context,
	);
	logger.debug('baseOptions', baseOptions);

	const buildableFiles = await getBuildableFiles(baseOptions);
	const concurrency = options.concurrency ?? 5;

	const builtFiles = (
		await runFunctions(
			buildableFiles.map(
				(buildableFile) => () => buildFunction(buildableFile),
			),
			concurrency,
		)
	).filter(isDeployableFunction);

	// create a firebase.json in dist/<project-name> that links to all the functions

	// "functions": [
	// 	{
	// 	  "source": "functions-folder",
	// 	  "codebase": "functiions-name"
	// 	},
	//  ....
	//   ]

	const firebaseJson = {
		functions: builtFiles.map((buildFunction) => ({
			source: buildFunction.functionName,
			codebase: buildFunction.functionName,
		})),
	};

	// create the file in dist/<project-name>/firebase.json
	// write the firebaseJson to that file
	await writeFile(
		join(baseOptions.outputDirectory, 'firebase.json'),
		JSON.stringify(firebaseJson, undefined, 2),
	);

	const { projectName, workspace } = context;

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

	const packageManager = options.packageManager ?? 'pnpm';

	const commandArguments: string[] = [
		'firebase',
		'emulators:start',
		'--project',
		firebaseProjectId,
	];

	if (options.only) {
		commandArguments.push('--only', options.only.join(','));
	}

	if (options.firebaseJsonPath) {
		commandArguments.push('--config', options.firebaseJsonPath);
	}

	await execute({
		packageManager,
		commandArguments,
		cwd: baseOptions.outputDirectory,
	});

	return {
		success: true,
	};
};

export default executor;
