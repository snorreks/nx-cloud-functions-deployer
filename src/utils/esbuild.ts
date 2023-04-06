import { build, type Loader, type PluginBuild } from 'esbuild';
import { readFileSync } from 'node:fs';
import { extname, dirname as _dirname } from 'path';
import type { NodeVersion } from '$types';
import { logger } from '$utils';

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
	sourceRoot: string;
	keepNames?: boolean;
	footer?: string;
	nodeVersion: NodeVersion;
	requireFix?: boolean;
	sourcemap?: boolean;
	tsconfig: string;
}): Promise<void> => {
	logger.debug('executeEsbuild', options);
	const {
		inputPath,
		outputPath,
		external,
		sourceRoot,
		keepNames,
		footer,
		requireFix,
		sourcemap,
		tsconfig,
	} = options;
	const plugins = [dirnamePlugin];

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
		tsconfig,
		outfile: outputPath,
		platform: 'node',
		plugins,
		target: `node${options.nodeVersion}`,
		keepNames,
		sourceRoot,
	});

	if (result.errors?.length) {
		throw new Error(result.errors[0].text);
	}
};
