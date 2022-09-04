import execa from 'execa';
import { copy } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';

const copyPackageJson = async () => {
	try {
		const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
		const newPackageJson = {
			...packageJson,
			dependencies: {},
			devDependencies: {},
			scripts: {},
		};

		await writeFile(
			'dist/package.json',
			JSON.stringify(newPackageJson, undefined, 2),
		);
	} catch (error) {
		console.error('copyFilesToDistFolder', error);
	}
};

const copyFilesToDistributionFolder = async () => {
	try {
		await Promise.all([
			copy('./executors.json', 'dist/executors.json'),
			copy(
				'src/executors/deploy/schema.json',
				'dist/src/executors/deploy/schema.json',
			),

			copyPackageJson(),
		]);
	} catch (error) {
		console.error('copyFilesToDistFolder', error);
	}
};

const compileTypescriptFiles = async () => {
	try {
		await execa('pnpm', ['tsc']);
	} catch (error) {
		console.error('compileTypescriptFiles', error);
	}
};

copyFilesToDistributionFolder();
compileTypescriptFiles();
