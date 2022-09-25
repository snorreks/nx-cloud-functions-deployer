import type { Executor, ExecutorContext } from '@nrwl/devkit';
import type {
	Flavor,
	RunScriptEnvironment,
	RunScriptOptions,
	ScriptExecutorOptions,
} from '$types';
import { join } from 'node:path';
import { logger } from '$utils/logger';

import { nodeRunFile } from '$utils/execute';

const getRunScriptOptions = (
	options: ScriptExecutorOptions,
	context: ExecutorContext,
): RunScriptOptions => {
	try {
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
		const scriptsRoot = join(projectRoot, options.scriptsRoot ?? 'scripts');

		const functionsConfigPath = join(
			projectRoot,
			`functions-config.${flavor}.ts`,
		);

		const tsconfigPath = options.tsconfig
			? join(projectRoot, options.tsconfig)
			: undefined;
		const dirname = __dirname;

		const envConfigPath = join(dirname, '.env');
		const runScriptFilePath = join(dirname, 'run-script.js');

		return {
			script: options.script,
			flavor,
			projectRoot,
			tsconfigPath,
			scriptsRoot,
			functionsConfigPath,
			envConfigPath,
			runScriptFilePath,
			firebaseProjectId,
			runPrevious: options.runPrevious,
			packageManager: options.packageManager ?? 'pnpm',
		};
	} catch (error) {
		logger.error('getRunScriptOptions', error);
		throw error;
	}
};

const runScript = async (options: RunScriptOptions): Promise<boolean> => {
	try {
		const {
			projectRoot,
			tsconfigPath,
			runScriptFilePath,
			firebaseProjectId,
			functionsConfigPath,
			scriptsRoot,
			runPrevious,
			script,
		} = options;

		const runScriptEnvironment: RunScriptEnvironment = {
			CFD_FIREBASE_PROJECT_ID: firebaseProjectId,
			CFD_FUNCTIONS_CONFIG_PATH: functionsConfigPath,
			CFD_SCRIPTS_ROOT: scriptsRoot,
			CFD_SCRIPT_FILE_NAME: script,
			CFD_RUN_PREVIOUS: runPrevious ? '1' : '0',
		};
		await nodeRunFile({
			cwd: projectRoot,
			tsconfigPath,
			runScriptFilePath: runScriptFilePath,
			environment: runScriptEnvironment,
		});

		return true;
	} catch (error) {
		logger.error('runScript', error);
		return false;
	}
};

const executor: Executor<ScriptExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const runScriptOptions = getRunScriptOptions(options, context);

	const success = await runScript(runScriptOptions);

	return {
		success,
	};
};

export default executor;