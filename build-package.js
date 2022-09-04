import execa from 'execa';
import { copy } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';

const incrementVersion = (currentVersion) => {
	try {
		const [major, minor, patch] = currentVersion.split('.');
		const newPatch = Number.parseInt(patch) + 1;
		return `${major}.${minor}.${newPatch}`;
	} catch (error) {
		console.error('incrementVersion', error);
	}
};

const copyPackageJson = async () => {
	try {
		const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
		const newPackageJson = {
			...packageJson,
			dependencies: {},
			devDependencies: {},
			scripts: {},
			type: 'commonjs',
		};
		const currentVersion = process.env.CURRENT_NPM_VERSION;
		console.log('env', process.env);

		console.log('currentVersion', currentVersion);
		if (currentVersion) {
			newPackageJson.version = incrementVersion(currentVersion);
		}

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
			copy('./README.md', 'dist/README.md'),
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
