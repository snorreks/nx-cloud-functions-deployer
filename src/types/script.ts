import type { PackageManager } from '$types';
type InputConfig = {
	message: string;
	default?: string;
	required?: boolean;
	transformer?: (
		value: string,
		{
			isFinal,
		}: {
			isFinal: boolean;
		},
	) => string;
	validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export interface ScriptOpenURLResponse {
	/** If this is defined, the value/url will be opened in the default browser */
	openURL: string;
}

export type ScriptResponse = ScriptOpenURLResponse | unknown;

export type ScriptFunction = (options: {
	prompt(questions: InputConfig): Promise<string>;
}) => Promise<ScriptResponse> | ScriptResponse;

export interface ScriptExecutorOptions {
	silent?: boolean;
	verbose?: boolean;
	/** If true, will set the flavor as production */
	production?: boolean;
	/** If true, will set the flavor as development */
	development?: boolean;
	scriptsRoot?: string;
	packageManager?: PackageManager;
	tsconfig?: string;

	/** Rerun the last executed script */
	runPrevious?: boolean;

	script?: string;

	scriptConfigPath?: string | false;
	flavor?: string;
	flavors: Record<string, string>;

	extraEnvs?: string;
}

export type RunScriptEnvironment = {
	CFD_PROJECT_ROOT: string;
	CFD_FIREBASE_PROJECT_ID: string;
	CFD_SCRIPT_CONFIG_PATH?: string;
	CFD_SCRIPTS_ROOT: string;
	CFD_RUN_PREVIOUS: '1' | '0';
	CFD_VERBOSE: '1' | '0';
	CFD_SCRIPT_FILE_NAME: string | undefined;
	CFD_ENV_CONFIG_PATH?: string;
	CFD_RUN_SCRIPT_FILE_DIRECTORY: string;
};

export interface RunScriptOptions {
	flavor: string;
	firebaseProjectId: string;
	packageManager: PackageManager;
	scriptsRoot: string;
	scriptConfigPath?: string;
	envConfigPath: string;
	projectRoot: string;
	tsconfigPath?: string;
	runScriptFilePath: string;
	/** Rerun the last executed script */
	runPrevious?: boolean;

	script?: string;

	verbose?: boolean;

	extraEnvs?: string;
}
