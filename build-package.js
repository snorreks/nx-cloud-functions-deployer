import { copy } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import execa from 'execa';
import { replaceTscAliasPaths } from 'tsc-alias';

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
			copy('./src/executors/executors.json', 'dist/executors.json'),
			copy('./README.md', 'dist/README.md'),
			copy(
				'src/executors/deploy/schema.json',
				'dist/executors/deploy/schema.json',
			),
			copy(
				'src/executors/build/schema.json',
				'dist/executors/build/schema.json',
			),
			copyPackageJson(),
		]);
	} catch (error) {
		console.error('copyFilesToDistFolder', error);
	}
};

const compileTypescriptFiles = async () => {
	try {
		/** @type {import('esbuild').BuildOptions} */
		const baseBuildOptions = {
			bundle: true,
			minify: true,
			platform: 'node',
			sourcemap: true,
			plugins: [
				alias({
					entries: {
						$types: './src/types/index.ts',
						$utils: './src/utils/index.ts',
						$constants: './src/constants/index.ts',
					},
				}),
				nodeExternalsPlugin(),
			],
			target: 'node14',
		};

		await Promise.all([
			execa('pnpm', ['tsc', '-noEmit']),
			(async () => {
				await execa('pnpm', [
					'tsc',
					'--project',
					'./tsconfig.types.json',
				]);
				replaceTscAliasPaths({
					options: './tsconfig.types.json',
				});
			})(),
			build({
				...baseBuildOptions,
				entryPoints: ['./src/index.ts'],
				outfile: 'dist/index.js',
			}),
			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/deploy/index.ts'],
				outfile: 'dist/executors/deploy/index.js',
				external: ['esbuild', 'esbuild-plugin-alias'],
			}),
			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/build/index.ts'],
				outfile: 'dist/executors/build/index.js',
				external: ['esbuild', 'esbuild-plugin-alias'],
			}),
		]);
	} catch (error) {
		console.error('compileTypescriptFiles', error);
	}
};

copyFilesToDistributionFolder();
compileTypescriptFiles();
