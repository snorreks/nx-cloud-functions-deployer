import { build } from 'esbuild';
import alias from 'esbuild-plugin-alias';
import { join } from 'node:path';
import type { EsbuildAlias, LogLevel } from '$types';

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
	const result = await build({
		banner: {
			js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
		},
		bundle: true,
		entryPoints: [inputPath],
		external,
		format: 'esm',
		logLevel,
		metafile: true,
		minify: true,
		outExtension: {
			'.js': '.mjs',
		},
		outfile: outputPath,
		platform: 'node',
		plugins: options.alias ? [alias(options.alias)] : [],
		sourcemap: true,
		sourceRoot: workspaceRoot,
		target: 'node16',
		tsconfig: tsConfigPath,
	});

	return !result.errors?.length;
};
