import type { NodeVersion } from './helper-options';

export interface BuildExecutorOptions {
	/**
	 * Clear output directory.
	 *
	 * @default true
	 */

	clear?: boolean;
	/**
	 * The path to the entry file.
	 *
	 * @default 'src/index.ts'
	 */
	inputPath?: string;
	/**
	 * The path to the output directory.
	 *
	 * @default 'dist'
	 */
	outputRoot?: string;
	/** The external dependencies. */
	external?: string[];

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

	/**
	 * Create a package.json file in the output directory.
	 *
	 * @default true
	 */
	createPackageJson?: boolean;
}
