import type { PackageManager } from './deploy';
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
	 * The package manager to use when running firebase-tools.
	 *
	 * Set `global` to use the globally installed firebase-tools (`npm i -g
	 * firebase-tools`).
	 *
	 * @default 'pnpm'
	 */
	packageManager: PackageManager;
}
