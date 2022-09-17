import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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
	await mkdir(outputRoot, { recursive: true });
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
	await mkdir(outputRoot, { recursive: true });

	await writeFile(
		join(outputRoot, 'package.json'),
		JSON.stringify(newPackageJson, undefined, 2),
	);
};
