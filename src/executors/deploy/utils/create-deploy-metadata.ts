import { writeFile } from 'node:fs/promises';
import { copy } from 'fs-extra';
import { join } from 'node:path';
import type { BuildFunctionData } from '$types';
import { runCommand } from '$utils/execute';
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
	external,
}: BuildFunctionData) => {
	// const packageJsonPath = join(workspaceRoot, projectRoot, 'package.json');
	// const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

	const newPackageJson = {
		type: 'module',
		main: 'src/index.js',
		engines: {
			node: '16',
		},
	};

	await writeFile(
		join(outputRoot, 'package.json'),
		JSON.stringify(newPackageJson, undefined, 2),
	);

	if (external && external.length > 0) {
		await runCommand({
			command: 'npm',
			commandArguments: ['install', ...external],
			cwd: outputRoot,
		});
	}
};

export const createEnvironmentFile = async ({
	environmentFileCode,
	outputRoot,
}: BuildFunctionData): Promise<void> => {
	if (!environmentFileCode) {
		return;
	}
	await writeFile(join(outputRoot, '.env'), environmentFileCode);
};

export const copyAssets = async ({ outputRoot, assets }: BuildFunctionData) => {
	if (!assets || !assets.length) {
		return;
	}

	await Promise.all(
		assets.map((asset) => {
			copy(asset, join(outputRoot, 'src', asset));
		}),
	);
};
