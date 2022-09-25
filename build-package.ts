import { copy } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import execa from 'execa';
import { replaceTscAliasPaths } from 'tsc-alias';
import { BuildOptions } from 'esbuild';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

type Version = `${string}.${string}.${string}`;

const incrementVersion = (currentVersion: Version): Version => {
	try {
		const [major, minor, patch] = currentVersion.split('.');
		const newPatch = Number.parseInt(patch) + 1;
		return `${major}.${minor}.${newPatch}`;
	} catch (error) {
		console.error('incrementVersion', error);
		return currentVersion;
	}
};

const copyPackageJson = async () => {
	try {
		const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
		const newPackageJson = {
			...packageJson,
			// dependencies: {},
			devDependencies: {},
			scripts: {},
			type: 'commonjs',
		};
		const currentVersion = process.env.CURRENT_NPM_VERSION as
			| Version
			| undefined;
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

const copyFiles = async () => {
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
			copy(
				'src/executors/script/schema.json',
				'dist/executors/script/schema.json',
			),
			copy(
				'src/executors/script/run-script.ts',
				'dist/executors/script/run-script.ts',
			),
			copyPackageJson(),
		]);
	} catch (error) {
		console.error('copyFilesToDistFolder', error);
	}
};

const compileTypescriptFiles = async () => {
	try {
		const dirname = fileURLToPath(new URL('.', import.meta.url));
		const projectAlias = alias({
			$types: join(dirname, 'src/types/index.ts'),
			$utils: join(dirname, 'src/utils/index.ts'),
			'$utils/*': join(dirname, 'src/utils/*'),
			$constants: join(dirname, 'src/constants/index.ts'),
			'$constants/*': join(dirname, 'src/constants/*'),
		});

		const baseBuildOptions: BuildOptions = {
			bundle: true,
			minify: true,
			platform: 'node',
			// format: 'cjs',
			treeShaking: true,
			sourcemap: true,
			plugins: [projectAlias, nodeExternalsPlugin()],
			target: 'node16',
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
					configFile: './tsconfig.types.json',
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
			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/script/index.ts'],
				outfile: 'dist/executors/script/index.js',
			}),
			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/script/run-script.ts'],
				outfile: 'dist/executors/script/run-script.js',
				plugins: [projectAlias],
			}),
		]);
	} catch (error) {
		console.error('compileTypescriptFiles', error);
	}
};

const buildProject = async (): Promise<void> => {
	await Promise.all([copyFiles(), compileTypescriptFiles()]);
};

buildProject();
