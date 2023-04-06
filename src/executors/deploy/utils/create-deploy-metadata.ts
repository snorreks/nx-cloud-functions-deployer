import { writeFile } from 'node:fs/promises';
import { copy } from 'fs-extra';
import { join } from 'node:path';
import type { BuildFunctionData } from '$types';
import { toDotEnvironmentCode } from '$utils/common';
import { getEnvironmentNeeded } from './read-compiled-file';

export const createDeployFirebaseJson = async ({
	outputRoot,
}: BuildFunctionData) => {
	const firebaseJson = {
		functions: {
			source: '.',
		},
	};
	await writeFile(
		join(outputRoot, 'firebase.json'),
		JSON.stringify(firebaseJson, undefined, 2),
	);
};

export const createDeployPackageJson = async ({
	outputRoot,
	nodeVersion,
}: BuildFunctionData) => {
	// const packageJsonPath = join(workspaceRoot, projectRoot, 'package.json');
	// const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

	const newPackageJson = {
		type: 'module',
		main: 'src/index.js',
		engines: {
			node: nodeVersion,
		},
	};

	await writeFile(
		join(outputRoot, 'package.json'),
		JSON.stringify(newPackageJson, undefined, 2),
	);
};

export const createEnvironmentFile = async (
	buildFunctionData: BuildFunctionData,
): Promise<void> => {
	const { outputRoot } = buildFunctionData;

	const environment = await getEnvironmentNeeded(buildFunctionData);
	if (!environment) {
		return;
	}

	let environmentFileCode = toDotEnvironmentCode(environment);

	if (buildFunctionData.sentry) {
		environmentFileCode += `\nSENTRY_RELEASE=${buildFunctionData.sentry.release}`;
	}

	if (!environment.CFD_FUNCTION_NAME) {
		environmentFileCode += `\nCFD_FUNCTION_NAME=${buildFunctionData.functionName}`;
	}

	await writeFile(join(outputRoot, '.env'), environmentFileCode);
};

export const copyAssets = async ({
	outputRoot,
	assets,
	projectRoot,
}: BuildFunctionData) => {
	if (!assets || !assets.length) {
		return;
	}

	await Promise.all(
		assets.map((asset) => {
			copy(
				join(projectRoot, 'src/assets', asset),
				join(outputRoot, 'src', asset),
			);
		}),
	);
};
