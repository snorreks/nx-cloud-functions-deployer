import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DeployableFileData } from '$types';

export const createDeployFirebaseJson = async ({
	outputRoot,
}: {
	outputRoot: string;
}) => {
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
}: {
	outputRoot: string;
}) => {
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
};

export const createEnvironmentFile = async ({
	environmentFileCode,
	outputRoot,
}: DeployableFileData): Promise<void> => {
	if (!environmentFileCode) {
		return;
	}
	await writeFile(join(outputRoot, '.env'), environmentFileCode);
};
