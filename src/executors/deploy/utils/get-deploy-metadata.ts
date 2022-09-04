import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
	type DeployDirectoryType,
	deployDirectoryTypes,
	EsbuildAlias,
	FunctionType,
	RelativeDeployFilePath,
} from '../types';

export const getDeployableFilePaths = async (
	sourceDirectory: string,
): Promise<string[]> => {
	const functions: string[] = [];

	const deployDirectories = await readdir(sourceDirectory, {
		withFileTypes: true,
	});

	for (const deployDirectory of deployDirectories) {
		if (!deployDirectory.isDirectory()) {
			continue;
		}
		const name = deployDirectory.name;
		if (!deployDirectoryTypes.includes(name as DeployDirectoryType)) {
			continue;
		}

		await recursiveGetFunctions(join(sourceDirectory, name), functions);
	}
	return functions;
};

export const getFunctionName = async (filePath: string) => {
	const code = await readFile(filePath, 'utf8');

	if (code.includes('/// function-name:')) {
		const name = code.match(/.*function-name: (.*)/);
		if (name) {
			return name[1].replaceAll('-', '_');
		}
	}

	const relativeFilePath = toRelativeDeployFilePath(filePath);
	const paths = relativeFilePath.split('\\');
	paths.shift(); // remove the first element, which is the directory type
	for (const path of paths) {
		if (path.startsWith('[')) {
			// remove form array
			paths.splice(paths.indexOf(path), 1);
		}
	}

	const functionName = paths.join('_').replace(/\.ts$/, '');
	return functionName.replaceAll('-', '_');
};

export const toFunctionType = (path: string): FunctionType => {
	switch (true) {
		case path.includes('callable'):
			return 'onCall';
		case path.includes('scheduler'):
			return 'schedule';
		case path.includes('storage'):
			throw new Error('Storage functions are not supported yet');

		case path.endsWith('created.ts'):
			return 'onCreate';
		case path.endsWith('updated.ts'):
			return 'onUpdate';
		case path.endsWith('deleted.ts'):
			return 'onDelete';
		default:
			return 'onRequest';
	}
};

export const toRelativeDeployFilePath = (
	filePath: string,
): RelativeDeployFilePath => {
	const index = filePath.indexOf('controllers');
	if (index === -1) {
		return filePath as RelativeDeployFilePath;
	}
	return filePath.slice(
		index + 'controllers'.length + 1,
	) as RelativeDeployFilePath;
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
			if (path.endsWith('.ts') && !path.endsWith('utils.ts')) {
				functionPaths.push(path);
			}
		}
	}
};

export const getAliasFromBaseTsConfig = async (
	workspaceRoot: string,
	baseTsConfigFileName = 'tsconfig.base.json',
): Promise<EsbuildAlias> => {
	const baseTsConfig = await readFile(
		join(workspaceRoot, baseTsConfigFileName),
		'utf8',
	);

	const match = baseTsConfig.match(/("paths":)(.+?)(})/s);
	if (!match) {
		return {};
	}

	const match2 = match[0].match(/({)(.+?)(})/s);

	if (!match2) {
		return {};
	}
	try {
		const paths = JSON.parse(match2[0]);
		const alias: EsbuildAlias = {};

		const fixPath = (path: string) => {
			if (path.endsWith('index.ts')) {
				return join(workspaceRoot, path);
			}
			return join(workspaceRoot, path, 'index.ts');
		};

		for (const [key, value] of Object.entries(paths)) {
			if (Array.isArray(value) && typeof value[0] === 'string') {
				alias[key] = fixPath(value[0]);
			} else if (typeof value === 'string') {
				alias[key] = fixPath(value);
			}
		}

		console.log('base alias found:', alias);
		return alias;
	} catch (error) {
		console.error(error);
		return {};
	}
};
