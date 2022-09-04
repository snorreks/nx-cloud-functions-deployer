import execa from 'execa';
import { copy } from 'fs-extra';

const copyFilesToDistributionFolder = async () => {
	try {
		await Promise.all([
			copy('./executors.json', 'dist/executors.json'),
			copy('./package.json', 'dist/package.json'),
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
