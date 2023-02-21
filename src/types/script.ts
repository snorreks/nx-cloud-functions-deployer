import type { PackageManager } from '$types';

export interface ScriptExecutorOptions {
	/**
	 * The firebase project id of the production flavor.
	 *
	 * @deprecated use {@link ScriptExecutorOptions.flavors} instead
	 */
	firebaseProjectProdId?: string;
	/**
	 * The firebase project id of the development flavor
	 *
	 * @deprecated use {@link ScriptExecutorOptions.flavors} instead
	 */
	firebaseProjectDevId?: string;

	silent?: boolean;
	verbose?: boolean;
	prod?: boolean;
	dev?: boolean;
	scriptsRoot?: string;
	packageManager?: PackageManager;
	tsconfig?: string;

	/** Rerun the last executed script */
	runPrevious?: boolean;

	script?: string;

	functionsConfigPath?: string | false;
	flavor?: string;
	flavors?: {
		[flavor: string]: string;
	};
}

export type RunScriptEnvironment = {
	CFD_FIREBASE_PROJECT_ID: string;
	CFD_FUNCTIONS_CONFIG_PATH?: string;
	CFD_SCRIPTS_ROOT: string;
	CFD_RUN_PREVIOUS: '1' | '0';
	CFD_VERBOSE: '1' | '0';
	CFD_SCRIPT_FILE_NAME: string | undefined;
	CFD_ENV_CONFIG_PATH?: string;
};

export interface RunScriptOptions {
	flavor: string;
	firebaseProjectId: string;
	packageManager: PackageManager;
	scriptsRoot: string;
	functionsConfigPath?: string;
	envConfigPath: string;
	projectRoot: string;
	tsconfigPath?: string;
	runScriptFilePath: string;
	/** Rerun the last executed script */
	runPrevious?: boolean;

	script?: string;

	verbose?: boolean;
}
