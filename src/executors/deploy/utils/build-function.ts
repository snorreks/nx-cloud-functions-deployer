import alias from 'esbuild-plugin-alias';
import { join } from 'node:path';
import type { EsbuildAlias, LogLevel } from '$types';
import { build, type Loader, type PluginBuild } from 'esbuild';
import { readFileSync } from 'node:fs';
import { extname, dirname as _dirname } from 'path';

export interface EsBuildCloudFunction {
	inputPath: string;
	outputRoot: string;
	workspaceRoot: string;
	projectRoot: string;
	external?: string[];
	tsConfigPath?: string;
	alias?: EsbuildAlias;
	logLevel?: LogLevel;
}

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
	options: EsBuildCloudFunction,
): Promise<boolean> => {
	const {
		external,
		inputPath,
		outputRoot,
		tsConfigPath,
		workspaceRoot,
		logLevel,
	} = options;

	const outputPath = join(outputRoot, 'src/index.js');

	const plugins = [dirnamePlugin];
	if (options.alias) {
		plugins.push(alias(options.alias));
	}

	const result = await build({
		banner: {
			js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
		},
		bundle: true,
		entryPoints: [inputPath],
		external,
		format: 'esm',
		logLevel,
		// metafile: true,
		minify: true,
		// outExtension: {
		// 	'.js': '.cjs',
		// },
		outfile: outputPath,
		platform: 'node',
		plugins,
		sourcemap: true,
		sourceRoot: workspaceRoot,
		target: 'node16',
		tsconfig: tsConfigPath,
	});

	return !result.errors?.length;
};
