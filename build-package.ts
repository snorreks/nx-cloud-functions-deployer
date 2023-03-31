import { copy, emptyDir } from 'fs-extra';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import nvexeca from 'nvexeca';
import { replaceTscAliasPaths } from 'tsc-alias';
import { BuildOptions } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Version = `${string}.${string}.${string}`;
const dirname = fileURLToPath(new URL('.', import.meta.url));

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
			// should we not show the dependencies in the package.json?
			// dependencies: {},
			// devDependencies: {},
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
				'src/executors/delete/schema.json',
				'dist/executors/delete/schema.json',
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
				'src/executors/sam/sam-deploy/schema.json',
				'dist/executors/sam/sam-deploy/schema.json',
			),
			copy(
				'src/executors/sam/sam-logs/schema.json',
				'dist/executors/sam/sam-logs/schema.json',
			),

			copyPackageJson(),
		]);
		console.log('Files copied');
	} catch (error) {
		console.error('copyFilesToDistFolder', error);
	}
};

const compileTypescriptFiles = async () => {
	try {
		const projectAlias = alias({
			$types: resolve(dirname, './src/types/index.ts'),
			$utils: resolve(dirname, './src/utils/index.ts'),
			'$utils/*': resolve(dirname, './src/utils/*'),
			$constants: resolve(dirname, './src/constants/index.ts'),
			'$constants/*': resolve(dirname, './src/constants/*'),
		});

		const baseBuildOptions: BuildOptions = {
			bundle: true,
			minify: true,
			platform: 'node',
			splitting: false,
			// format: 'cjs',
			treeShaking: true,
			sourcemap: true,
			plugins: [projectAlias, nodeExternalsPlugin()],
			target: 'node18',
		};

		await Promise.all([
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
				entryPoints: ['./src/executors/delete/index.ts'],
				outfile: 'dist/executors/delete/index.js',
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
				entryPoints: ['./src/executors/sam/sam-deploy/index.ts'],
				outfile: 'dist/executors/sam/sam-deploy/index.js',
			}),
			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/sam/sam-logs/index.ts'],
				outfile: 'dist/executors/sam/sam-logs/index.js',
			}),

			build({
				...baseBuildOptions,
				entryPoints: ['./src/executors/script/run-script.ts'],
				outfile: 'dist/executors/script/run-script.js',
				plugins: [projectAlias],
			}),
			// build({
			// 	...baseBuildOptions,
			// 	entryPoints: ['./src/executors/script/storage.ts'],
			// 	outfile: 'dist/executors/script/storage.js',
			// 	plugins: [projectAlias],
			// }),
		]);
		console.log('Typescript files compiled');
	} catch (error) {
		console.error('compileTypescriptFiles', error);
	}
};

const buildProject = async (): Promise<void> => {
	// check if CI is true, if not clear the dist folder
	if (!process.env.CI) {
		await emptyDir('dist');
		console.log('Dist folder cleared');
	}

	await Promise.all([
		copyFiles(),
		compileTypescriptFiles(),
		addTypescriptDefinitions(),
	]);
};

const addTypescriptDefinitions = async () => {
	const { childProcess } = await nvexeca('16', 'pnpm', [
		'tsc',
		'--project',
		'./tsconfig.types.json',
	]);
	await childProcess;
	replaceTscAliasPaths({
		configFile: resolve(dirname, './tsconfig.types.json'),
	});
	await unlink(resolve(dirname, 'tsconfig.types.tsbuildinfo'));

	console.log('Typescript definitions compiled');
};

// create function that deletes all files that has ends with .d.ts in output directory, and exclude index.d.ts.
// make it recursive for all subdirectories, and use fs/promises or fs-extra
// const deleteDtsFiles = async (directory: string) => {
// 	try {
// 		const files = await readdir(directory, { withFileTypes: true });
// 		await Promise.all(
// 			files.map(async (file) => {
// 				if (file.isDirectory()) {
// 					await deleteDtsFiles(resolve(directory, file.name));
// 				} else if (file.isFile()) {
// 					if (
// 						file.name.endsWith('.d.ts') &&
// 						file.name !== 'index.d.ts'
// 					) {
// 						await unlink(resolve(directory, file.name));
// 					}
// 				}
// 			}),
// 		);
// 	} catch (error) {
// 		console.error('deleteDtsFiles', error);
// 	}
// };

buildProject();
