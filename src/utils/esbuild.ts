import alias from 'esbuild-plugin-alias';
import { build, type Loader, type PluginBuild } from 'esbuild';
import { readFileSync } from 'node:fs';
import { extname, dirname as _dirname } from 'path';
import type { EsbuildAlias, NodeVersion } from '$types';

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

export const executeEsbuild = async (options: {
	inputPath: string;
	outputPath: string;
	external?: string[];
	alias?: EsbuildAlias;
	sourceRoot: string;
	keepNames?: boolean;
	footer?: string;
	nodeVersion: NodeVersion;
	requireFix?: boolean;
	sourcemap?: boolean;
}): Promise<boolean> => {
	const {
		inputPath,
		outputPath,
		external,
		sourceRoot,
		keepNames,
		footer,
		requireFix,
		sourcemap,
	} = options;
	const plugins = [dirnamePlugin];
	if (options.alias) {
		plugins.push(alias(options.alias));
	}

	const result = await build({
		banner: requireFix
			? {
					js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
			  }
			: undefined,
		footer: footer ? { js: footer } : undefined,
		bundle: true,
		entryPoints: [inputPath],
		format: 'esm',
		external,
		minify: true,
		sourcemap,
		treeShaking: true,
		outfile: outputPath,
		platform: 'node',
		plugins,
		target: `node${options.nodeVersion}`,
		keepNames,
		sourceRoot,
	});

	return !result.errors?.length;
};
