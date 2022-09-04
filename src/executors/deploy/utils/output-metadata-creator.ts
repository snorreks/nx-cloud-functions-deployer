import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type BasePackageJson = { [key: string]: string | { [key: string]: string } };

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
	dependencies,
	outputRoot,
	projectRoot,
	workspaceRoot,
}: {
	workspaceRoot: string;
	projectRoot: string;
	dependencies?: { [key: string]: string };
	basePackageJson?: BasePackageJson;
	outputRoot: string;
}) => {
	const packageJsonPath = join(workspaceRoot, projectRoot, 'package.json');
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	const newPackageJson = {
		...packageJson,
		dependencies: {
			...packageJson.dependencies,
			...dependencies,
		},
	};
	await mkdir(outputRoot, { recursive: true });

	await writeFile(
		join(outputRoot, 'package.json'),
		JSON.stringify(newPackageJson, undefined, 2),
	);
};

export const getBasePackage = async ({
	projectRoot,
	workspaceRoot,
}: {
	workspaceRoot: string;
	projectRoot: string;
}): Promise<BasePackageJson> => {
	const packageJsonPath = join(workspaceRoot, projectRoot, 'package.json');
	const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
	return packageJson as BasePackageJson;
};
