import alias from 'esbuild-plugin-alias';
import { join } from 'node:path';
import { build, LogLevel, type Loader, type PluginBuild } from 'esbuild';
import { readFileSync } from 'node:fs';
import { extname, dirname as _dirname } from 'path';
import { logger } from '$utils';
import type { DeployableFileData } from '$types';

const nodeModules = new RegExp(
	/^(?:.*[\\/])?node_modules(?:\/(?!postgres-migrations).*)?$/,
);
// https://github.com/evanw/esbuild/issues/859
const dirnamePlugin = {
	name: 'dirname',

	setup(build: PluginBuild) {
		build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
			if (filePath.match(nodeModules)) {
				return;
			}
			let contents = readFileSync(filePath, 'utf8');
			const loader = extname(filePath).substring(1) as Loader;
			const dirname = _dirname(filePath);
			contents = contents
				.replace('__dirname', `"${dirname}"`)
				.replace('__filename', `"${filePath}"`);
			return {
				contents,
				loader,
			};
		});
	},
};

export const buildCloudFunctionCode = async (
	deployableFileData: DeployableFileData,
	entryPointPath: string,
): Promise<boolean> => {
	const outputPath = join(deployableFileData.outputRoot, 'src/index.js');

	const plugins = [dirnamePlugin];
	if (deployableFileData.alias) {
		plugins.push(alias(deployableFileData.alias));
	}

	const result = await build({
		banner: {
			js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
		},
		bundle: true,
		entryPoints: [entryPointPath],
		format: 'esm',
		logLevel: toEsbuildLogLevel(),
		// metafile: true,
		minify: true,
		outExtension: {
			'.js': '.cjs',
		},
		outfile: outputPath,
		platform: 'node',
		plugins,
		sourcemap: true,
		sourceRoot: deployableFileData.workspaceRoot,
		target: 'node16',
	});

	return !result.errors?.length;
};

const toEsbuildLogLevel = (): LogLevel | undefined => {
	switch (logger.currentLogSeverity) {
		case 'silent':
			return 'silent';
		case 'warn':
			return 'warning';
		case 'error':
			return 'error';
		default:
			return;
	}
};
