import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type {
	BaseDeployOptions,
	BuildFunctionData,
	EsbuildAlias,
} from '$types';
import { validateDeployFiles } from './typescript-parser';
import { execute, logger, toRelativeDeployFilePath } from '$utils';
import { getDeployableFileData } from './read-source-file';
import chalk from 'chalk';

export const validateProject = async ({
	packageManager,
	projectRoot,
	validate,
	tsconfig,
}: Pick<
	BaseDeployOptions,
	'packageManager' | 'projectRoot' | 'validate' | 'tsconfig'
>) => {
	if (!validate) {
		return;
	}
	const commandArguments: string[] = ['tsc', '-noEmit'];

	if (tsconfig) {
		commandArguments.push('--project', tsconfig);
	}
	// if (logger.verbose) {
	// 	commandArguments.push('--verbose');
	// }
	logger.info('Validating project...');
	await execute({
		packageManager,
		cwd: projectRoot,
		commandArguments,
	});
};

export const getBuildableFiles = async (
	options: BaseDeployOptions,
): Promise<BuildFunctionData[]> => {
	const { projectRoot, functionsDirectory, only } = options;

	const functionPaths: string[] = [];
	const functionsDirectoryPath = join(projectRoot, functionsDirectory);

	const functionDirectories = await readdir(functionsDirectoryPath, {
		withFileTypes: true,
	});

	for (const directory of functionDirectories) {
		if (!directory.isDirectory()) {
			continue;
		}
		const name = directory.name;

		await recursiveGetFunctions(
			join(functionsDirectoryPath, name),
			functionPaths,
		);
	}

	const deployableFunctions = validateDeployFiles(functionPaths, options);
	if (!only) {
		for (const functionPath of functionPaths) {
			if (
				!deployableFunctions.some(
					(deployableFunction) =>
						deployableFunction.absolutePath === functionPath,
				)
			) {
				logger.warn(
					`${chalk.bold(
						toRelativeDeployFilePath(
							functionPath,
							functionsDirectory,
						),
					)} is not a valid deployable function, skipping.`,
				);
			}
		}
	}

	return await Promise.all(deployableFunctions.map(getDeployableFileData));
};

const recursiveGetFunctions = async (
	directory: string,
	functionPaths: string[],
) => {
	const files = await readdir(directory, { withFileTypes: true });
	for (const file of files) {
		if (file.isDirectory()) {
			await recursiveGetFunctions(
				resolve(directory, file.name),
				functionPaths,
			);
		} else {
			const path = resolve(directory, file.name);
			if (path.endsWith('.ts')) {
				functionPaths.push(path.replaceAll('\\', '/'));
			}
		}
	}
};

/**
 * Get the aliases from the base tsconfig.json file in the monorepo.
 *
 * @example
 *
 * ```json
 * // base.tsconfig.json in the workspace root:
 * "compilerOptions": {
 * 	"baseurl": ".",
 * 	"paths": {
 * 		"@shared/utils":["libs/shared/utils/src"],
 * 		"@shared/types": ["libs/shared/types/src"]
 * 	}
 * }
 * ...
 * ```
 *
 * ```ts
 * const aliases = getAliases('workspace-root');
 *
 * // aliases = {
 * // 	'@shared/utils': '@shared/utils/src/index.ts',
 * // 	'@shared/types': '@shared/types/src/index.ts',
 * // }
 * ```
 *
 * @param root The absolute path to the root
 * @param baseTsConfigFileName the name of the base tsconfig file. Defaults to
 *   `tsconfig.json`
 * @returns the aliases from the base tsconfig file
 */
export const getEsbuildAliasFromTsConfig = async (
	root: string,
	baseTsConfigFileName = 'tsconfig.json',
): Promise<EsbuildAlias | undefined> => {
	try {
		const baseTsConfig = await readFile(
			join(root, baseTsConfigFileName),
			'utf8',
		);
		const config = JSON.parse(removeComments(baseTsConfig));
		const paths = config?.compilerOptions?.paths;
		if (!paths) {
			return;
		}

		const alias: EsbuildAlias = {};

		const fixPath = (key: string, path: string) => {
			if (key.endsWith('/*')) {
				return join(root, path);
			}

			return join(root, path, 'index.ts');
		};

		for (const [key, value] of Object.entries(paths)) {
			if (Array.isArray(value) && typeof value[0] === 'string') {
				alias[key] = fixPath(key, value[0]);
			} else if (typeof value === 'string') {
				alias[key] = fixPath(key, value);
			}
		}
		return alias;
	} catch (error) {
		logger.error('getEsbuildAliasFromTsConfig', error);
		return;
	}
};

/**
 * Remove all comments from a string of code.
 *
 * @example
 *
 * ```ts
 * const code = `
 * // This is a comment
 * const a = 1;
 * `;
 *
 * removeComments(code); // 'const a = 1;'
 * ```
 *
 * @param code the string of code to remove comments from
 * @returns the string of code without comments
 */
const removeComments = (code: string): string => {
	return code.replace(/\/\*[\S\s]*?\*\/|\/\/.*/g, '').trim();
};
