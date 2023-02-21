import type { DeployFunction, FunctionBuilder } from './function-types';
import type { FunctionOptions, NodeVersion } from './helper-options';

export type EsbuildAlias = { [key: string]: string };

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'global';

interface SharedDeployExecutorBaseOptions {
	/** The project flavor */
	flavor?: string;
	/**
	 * The name of the tsconfig file in the project root.
	 *
	 * @default 'tsconfig.json'
	 */
	tsconfig?: string;
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
	packageManager: PackageManager;

	/**
	 * Relative path to the directory where the functions will be deployed.
	 *
	 * @default 'src/controllers'
	 */
	functionsDirectory?: string;

	/**
	 * Will run `tsc -noEmits` to validate the build.
	 *
	 * If this is not valid the all build will fail.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * The name of the file in the root project that will be used to fetch and
	 * update the cloud cache.
	 *
	 * @default 'functions-cache.{flavor}.ts'
	 */
	cloudCacheFileName: string;

	/**
	 * Will import the file in the deploy script from the project root
	 * directory. Helpful for setting up opentelemetry.
	 *
	 * @default 'src/logger.ts'
	 */
	includeFilePath?: string;

	ignoreMissingEnvironmentKey?: boolean;

	nodeVersion?: NodeVersion;
}

export interface DeployExecutorOptions extends SharedDeployExecutorBaseOptions {
	/**
	 * The firebase project id of the production flavor.
	 *
	 * @deprecated use {@link DeployExecutorOptions.flavors} instead
	 */
	firebaseProjectProdId?: string;
	/**
	 * The firebase project id of the development flavor
	 *
	 * @deprecated use {@link DeployExecutorOptions.flavors} instead
	 */
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
	 * @deprecated use {@link DeployExecutorOptions.envFiles} instead
	 * @default '.env.dev'
	 */
	devEnvFileName?: string;

	/**
	 * The file name ot the .env file to look for when deploying for flavor
	 * `production`
	 *
	 * @deprecated use {@link DeployExecutorOptions.envFiles} instead
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

	debug?: boolean;

	/** Only deploy the given function names, separated by a comma */
	only?: string;

	flavor?: string;
	flavors?: {
		[flavor: string]: string;
	};
	envFiles?: {
		[flavor: string]: string;
	};
}

export type Environment = { [key: string]: string | undefined };

export interface SentryLiteData {
	/** The name of the project in sentry. */
	project: string;
	/** The organization name in sentry. */
	organization: string;
	/**
	 * The sentry auth token.
	 *
	 * @see {@link https://docs.sentry.io/product/cli/configuration/#auth-token}
	 */
	token: string;
}

export interface SentryData extends SentryLiteData {
	/** The name of the release. */
	release: string;
}

export interface BaseDeployOptions extends SharedDeployExecutorBaseOptions {
	firebaseProjectId: string;
	projectRoot: string;
	workspaceRoot: string;
	outputDirectory: string;
	defaultRegion: string;
	temporaryDirectory: string;
	flavor: string;
	/** Stringified code of the environments */
	environment?: Environment;
	alias?: EsbuildAlias;

	/**
	 * Relative path to the directory where the functions will be deployed from
	 * the project root.
	 */
	functionsDirectory: string;

	only?: string[];

	currentTime: number;

	/** If this is defined, upload the sourcemaps to sentry. */
	sentry?: SentryLiteData;
}

export interface BuildFunctionLiteData<
	T extends FunctionBuilder = FunctionBuilder,
> extends BaseDeployOptions {
	/**
	 * The type of the function.
	 *
	 * @see {@link DeployFunction}
	 */
	deployFunction: DeployFunction;

	rootFunctionBuilder: T;
	/** The absolute path of the deploy file */
	absolutePath: string;

	relativeDeployFilePath: string;
}

export type BuildFunctionData<T extends FunctionBuilder = FunctionBuilder> =
	Omit<BuildFunctionLiteData<T>, 'sentry'> &
		FunctionOptions[T] & {
			/**
			 * If the type is `onCreate`, `onUpdate`, or `onDelete`, this is
			 * required
			 */
			path: T extends 'firestore' | 'database' ? string : undefined;

			/** The name of the function. */
			functionName: string;

			outputRoot: string;

			/**
			 * The region to deploy the function to. If not provided it will be
			 * the region set in project.json. If that is not provided it will
			 * be 'us-central1'
			 *
			 * @see https://firebase.google.com/docs/functions/locations
			 */
			region: string | string[];

			startTime: number;

			hasLoggerFile?: boolean;

			checksum?: string;

			sentry?: SentryData;
		};

export type DeployFunctionData<T extends FunctionBuilder = FunctionBuilder> =
	BuildFunctionData<T>;
