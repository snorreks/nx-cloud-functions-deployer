export type Flavor = 'dev' | 'prod';
export type EsbuildAlias = { [key: string]: string };

interface BaseOptions {
	/**
	 * The name of the tsconfig file in the project root.
	 *
	 * @default 'tsconfig.json'
	 */
	tsConfig?: string;
	/** The default region is us-central1 */
	region?: string;
	/** Only build the function, don't deploy it */
	dryRun?: boolean;
	/** Force deploy all functions, even if no files changed */
	force?: boolean;

	/**
	 * The package manager to use when running firebase-tools.
	 *
	 * Set `global` to use the globally installed firebase-tools (`npm i -g
	 * firebase-tools`).
	 *
	 * @default 'pnpm'
	 */
	packageManager: 'npm' | 'yarn' | 'pnpm' | 'global';

	/**
	 * Relative path to the directory where the functions will be deployed.
	 *
	 * @default 'src/controllers'
	 */
	functionsDirectory?: string;
}

export interface DeployExecutorOptions extends BaseOptions {
	/** The firebase project id of the production flavor */
	firebaseProjectProdId?: string;
	/** The firebase project id of the development flavor */
	firebaseProjectDevId?: string;
	/**
	 * The output directory of the build
	 *
	 * @default `dist/<relative-path-to-project>`
	 */
	outputDirectory?: string;
	/**
	 * If true, use the {@link firebaseProjectProdId} and look for the
	 * {@link prodEnvFileName} file
	 */
	prod?: boolean;
	/**
	 * If true, use the {@link firebaseProjectDevId} and look for the
	 * {@link devEnvFileName} file
	 */
	dev?: boolean;
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;
	/**
	 * The amount of functions to deploy in parallel
	 *
	 * @default 10
	 */
	concurrency?: number;

	/**
	 * The file name ot the .env file to look for when deploying for flavor
	 * `dev`
	 *
	 * @default '.env.dev'
	 */
	devEnvFileName?: string;

	/**
	 * The file name ot the .env file to look for when deploying for flavor
	 * `production`
	 *
	 * @default '.env.prod'
	 */
	prodEnvFileName?: string;

	/**
	 * Stringify version of the environment. If this is set, the
	 * {@link devEnvFileName} and {@link prodEnvFileName} will be ignored.
	 *
	 * This is useful when you want to deploy using CI/CD and don't want to
	 * store the environment variables in a file.
	 *
	 * @default undefined
	 */
	envString?: string;

	/** Only deploy the given function names, separated by a comma */
	only?: string;
}

export interface BaseDeployOptions extends BaseOptions {
	firebaseProjectId: string;
	projectRoot: string;
	workspaceRoot: string;
	outputDirectory: string;
	defaultRegion: string;
	temporaryDirectory: string;
	flavor: Flavor;
	environmentFileCode?: string;
	alias?: EsbuildAlias;

	/**
	 * Relative path to the directory where the functions will be deployed from
	 * the project root.
	 */
	functionsDirectory: string;
}
