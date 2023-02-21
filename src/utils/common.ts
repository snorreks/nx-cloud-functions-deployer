import type { Environment } from '$types';
import { platform } from 'node:os';

export const getEnvironmentFileName = (options: {
	prodEnvFileName?: string;
	devEnvFileName?: string;
	flavor: string;
	projectRoot: string;
	envFiles?: Record<string, string>;
}): string => {
	const { flavor, prodEnvFileName, devEnvFileName, envFiles } = options;

	if (envFiles && envFiles[flavor]) {
		return envFiles[flavor];
	}

	if (flavor === 'prod' && prodEnvFileName) {
		return prodEnvFileName;
	}
	if (flavor === 'dev' && devEnvFileName) {
		return devEnvFileName;
	}
	return `.env.${flavor}`;
};

export const getFlavor = (options: {
	flavors?: Record<string, string>;
	flavor?: string;
	prod?: boolean;
	dev?: boolean;
}): string => {
	if (options.flavor) {
		return options.flavor;
	}
	if (options.prod) {
		return 'prod';
	}
	if (options.dev) {
		return 'dev';
	}

	return Object.keys(options.flavors ?? {})[0] ?? 'dev';
};

export const getFirebaseProjectId = (options: {
	flavors?: Record<string, string>;
	flavor: string;
	/**
	 * The firebase project id of the production flavor.
	 *
	 * @deprecated use {@link flavors} instead
	 */
	firebaseProjectProdId?: string;
	/**
	 * The firebase project id of the development flavor
	 *
	 * @deprecated use {@link flavors} instead
	 */
	firebaseProjectDevId?: string;
}): string | undefined => {
	if (options.flavors && options.flavors[options.flavor]) {
		return options.flavors[options.flavor];
	}

	if (options.flavor === 'prod') {
		return options.firebaseProjectProdId;
	}

	return options.firebaseProjectDevId;
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

export const toImportPath = (typescriptFilePath: string): string => {
	const importPath = typescriptFilePath
		.replace('.ts', '')
		.replaceAll('\\', '/');

	// TODO migrate from absolute to relative paths from the root
	// need to find how many ../../../ from tmp to root

	if (platform() === 'win32') {
		return `file://${importPath}`;
	}

	return importPath;
};
