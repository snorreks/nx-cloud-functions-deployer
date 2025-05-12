import type { Executor, ExecutorContext } from '@nx/devkit';
import type {
	RunScriptEnvironment,
	RunScriptOptions,
	ScriptExecutorOptions,
} from '$types';
import { join } from 'node:path';
import { logger } from '$utils/logger';

import { runFile } from '$utils/execute';
import { getFirebaseProjectId, getFlavor } from '$utils';
const dirname = __dirname;

const getRunScriptOptions = (
	options: ScriptExecutorOptions,
	context: ExecutorContext,
): RunScriptOptions => {
	try {
		logger.debug('getRunScriptOptions', options);
		const {
			projectName,
			root: workspaceRoot,
			projectsConfigurations,
		} = context;
		if (!projectName) {
			throw new Error('Project name is not defined');
		}
		if (!projectsConfigurations) {
			throw new Error('projectsConfigurations is not defined');
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
		const relativeProjectPath =
			projectsConfigurations.projects[projectName].root;
		const projectRoot = join(workspaceRoot, relativeProjectPath);
		const scriptsRoot = join(projectRoot, options.scriptsRoot ?? 'scripts');
		const envConfigPath = join(projectRoot, `.env.${flavor}`);

		let scriptConfigPath: string | undefined;
		if (typeof options.scriptConfigPath === 'string') {
			scriptConfigPath = join(projectRoot, options.scriptConfigPath);
		} else if (typeof options.scriptConfigPath === 'undefined') {
			scriptConfigPath = join(projectRoot, `script-config.${flavor}.ts`);
		}

		let tsconfigPath: string | undefined;
		if (options.tsconfig) {
			tsconfigPath = join(projectRoot, options.tsconfig);
		}

		const runScriptFilePath = join(dirname, 'run-script.js');

		return {
			...options,
			flavor,
			projectRoot,
			tsconfigPath,
			scriptsRoot,
			scriptConfigPath,
			envConfigPath,
			runScriptFilePath,
			firebaseProjectId,
			packageManager: options.packageManager ?? 'pnpm',
		};
	} catch (error) {
		logger.error('getRunScriptOptions', error);
		throw error;
	}
};

const runScript = async (options: RunScriptOptions): Promise<boolean> => {
	try {
		logger.debug('runScript', options);
		const {
			projectRoot,
			tsconfigPath,
			runScriptFilePath,
			firebaseProjectId,
			scriptConfigPath,
			scriptsRoot,
			runPrevious,
			script,
			verbose,
			extraEnvs,
		} = options;

		const runScriptEnvironment: RunScriptEnvironment & {
			TS_NODE_PROJECT?: string;
			[key: string]: string | undefined;
		} = {
			CFD_PROJECT_ROOT: projectRoot,
			CFD_FIREBASE_PROJECT_ID: firebaseProjectId,
			CFD_SCRIPT_CONFIG_PATH: scriptConfigPath,
			CFD_SCRIPTS_ROOT: scriptsRoot,
			CFD_SCRIPT_FILE_NAME: script,
			CFD_RUN_PREVIOUS: runPrevious ? '1' : '0',
			TS_NODE_PROJECT: tsconfigPath,
			CFD_VERBOSE: verbose ? '1' : '0',
			CFD_ENV_CONFIG_PATH: options.envConfigPath,
			CFD_RUN_SCRIPT_FILE_DIRECTORY: dirname,
		};

		if (extraEnvs) {
			for (const extraEnv of extraEnvs.split(',')) {
				// split by equal
				const [key, value] = extraEnv.split('=');
				runScriptEnvironment[key] = value;
			}
		}
		try {
			await runFile({
				cwd: projectRoot,
				runScriptFilePath: runScriptFilePath,
				environment: runScriptEnvironment,
			});
			return true;
		} catch (_error) {
			return false;
		}
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
