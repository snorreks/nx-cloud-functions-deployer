import type { Flavor, PackageManager } from '$types';

export interface ScriptExecutorOptions {
	/** The firebase project id of the production flavor */
	firebaseProjectProdId: string;
	/** The firebase project id of the development flavor */
	firebaseProjectDevId: string;

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
}

export type RunScriptEnvironment = {
	CFD_FIREBASE_PROJECT_ID: string;
	CFD_FUNCTIONS_CONFIG_PATH: string;
	CFD_SCRIPTS_ROOT: string;
	CFD_RUN_PREVIOUS: '1' | '0';

	CFD_SCRIPT_FILE_NAME: string | undefined;
};

export interface RunScriptOptions {
	flavor: Flavor;
	firebaseProjectId: string;
	packageManager: PackageManager;
	scriptsRoot: string;
	functionsConfigPath: string;
	envConfigPath: string;
	projectRoot: string;
	tsconfigPath?: string;
	runScriptFilePath: string;
	/** Rerun the last executed script */
	runPrevious?: boolean;

	script?: string;
}
