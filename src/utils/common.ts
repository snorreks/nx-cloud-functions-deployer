import type { Environment } from '$types';
import { logger } from './logger';

export const getEnvironmentFileName = (options: {
	flavor: string;
	projectRoot: string;
	envFiles?: Record<string, string>;
}): string => {
	const { flavor, envFiles } = options;

	if (envFiles && envFiles[flavor]) {
		return envFiles[flavor];
	}

	return `.env.${flavor}`;
};

export const getFlavor = (options: {
	flavors: Record<string, string>;
	flavor?: string;
}): string => {
	if (options.flavor) {
		return options.flavor;
	}

	const flavor = Object.keys(options.flavors ?? {})[0];
	if (!flavor) {
		throw new Error('No flavor found');
	}
	return flavor;
};

export const getFirebaseProjectId = (options: {
	flavors: Record<string, string>;
	flavor: string;
}): string => {
	const { flavor, flavors } = options;
	if (!(flavor in flavors)) {
		throw new Error(`Flavor "${flavor}" not found in flavors`);
	}
	return flavors[flavor];
};

/**
 * @example toDisplayDuration(85600) // '1:25' toDisplayDuration(85600, true) //
 * '1:25.6'
 *
 * @param time the time in milliseconds
 * @returns a readable time
 */
export const toDisplayDuration = (time: number): string => {
	time = time / 1000;
	const getSeconds = (time: number) => Math.floor(time);

	if (time < 60) {
		return `00:${time < 10 ? `0${getSeconds(time)}` : getSeconds(time)}`;
	} else if (time < 3600) {
		const minutes = Math.trunc(time / 60);
		const seconds = time - minutes * 60;
		return `${minutes}:${
			seconds < 10 ? `0${getSeconds(seconds)}` : getSeconds(seconds)
		}`;
	} else {
		const hours = Math.trunc(time / 3600);
		const minutes = Math.trunc((time % 3600) / 60);
		const seconds = Math.trunc((time % 3600) % 60);
		return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${
			seconds < 10 ? `0${getSeconds(seconds)}` : getSeconds(seconds)
		}`;
	}
};

// Convert all text -, _, and . space and pascalCase to snake_case
export const toSnakeCase = (str: string): string => {
	return str
		.replace(/-/g, '_')
		.replace(/\./g, '_')
		.replace(/\s+/g, '_')
		.replace(/([a-z])([A-Z])/g, '$1_$2')
		.toLowerCase();
};

export const toCamelCase = (str: string): string => {
	return str.length === 1
		? str.toLowerCase()
		: str
				.replace(/^([A-Z])/, (m) => m[0].toLowerCase())
				.replace(/[_-]([a-z0-9])/g, (m) => m[1].toUpperCase());
};

export const removeUnderScore = (str: string): string => {
	return str.replace(/_/g, '');
};

export const toDotEnvironmentCode = <T extends Environment>(
	environment: T,
): string => {
	let environmentCode = '';

	for (const [key, value] of Object.entries(
		sortEnvironmentKeys(environment),
	)) {
		environmentCode += `${key}=${value}\n`;
	}

	return environmentCode.trim();
};

const sortEnvironmentKeys = <T extends Environment>(environment: T): T => {
	const sortedKeys = Object.keys(environment).sort();
	const sortedEnvironment: Environment = {};

	for (const key of sortedKeys) {
		sortedEnvironment[key] = environment[key];
	}

	return sortedEnvironment as T;
};

export const toImportPath = (
	typescriptFilePath: string,
	executeDirectory: string,
): string => {
	typescriptFilePath = typescriptFilePath
		.replace('.ts', '')
		.replaceAll('\\', '/');

	executeDirectory = executeDirectory
		.replace('.ts', '')
		.replaceAll('\\', '/');

	logger.log('toImportPath', { typescriptFilePath, executeDirectory });

	// get relative import path from execute directory to typescript file
	// split by / and remove empty strings, remove drive letter
	const typescriptFilePaths = typescriptFilePath.split('/');
	const executeDirectoryPaths = executeDirectory.split('/');

	// loop through the paths, if they are the same, remove them.
	// if they are different, then we need to do ../ for each remaining and then add the remaining

	let relativeImportPath = '';

	for (let i = 0; i < typescriptFilePaths.length; i++) {
		if (typescriptFilePaths[i] === executeDirectoryPaths[i]) {
			typescriptFilePaths.splice(i, 1);
			executeDirectoryPaths.splice(i, 1);
			i--;
		}

		if (typescriptFilePaths[i] !== executeDirectoryPaths[i]) {
			Array.from({ length: executeDirectoryPaths.length - i }).forEach(
				() => {
					relativeImportPath += '../';
				},
			);
			break;
		}
	}

	relativeImportPath += typescriptFilePaths.join('/');

	logger.log('toImportPath:relativeImportPath', relativeImportPath);

	return relativeImportPath;
};
