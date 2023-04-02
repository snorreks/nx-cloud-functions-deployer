import type { NodeVersion } from './helper-options';

export interface ExecutorBaseOptions {
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;

	debug?: boolean;
}

export interface ExecutorBaseBuildOptions extends ExecutorBaseOptions {
	/**
	 * The name of the tsconfig file in the project root.
	 *
	 * @default 'tsconfig.json'
	 */
	tsconfig?: string;
	/**
	 * Will run `tsc -noEmits` to validate the build.
	 *
	 * If this is not valid the all build will fail.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Will import the file in the deploy script from the project root
	 * directory. Helpful for setting up opentelemetry.
	 *
	 * @default 'src/logger.ts'
	 */
	includeFilePath?: string;

	/**
	 * The node version to target.
	 *
	 * @default '18'
	 */
	nodeVersion?: NodeVersion;

	/**
	 * To enable sourcemaps.
	 *
	 * @default true
	 */
	sourcemap?: boolean;

	requireFix?: boolean;
}
