import { build, type BuildOptions, type SameShape } from 'esbuild';
import { dirname as _dirname } from 'node:path';
import type { NodeVersion } from '$types';
import { logger } from '$utils';

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
	minify?: boolean;
	__dirnameFix?: boolean;
	__filenameFix?: boolean;
}): Promise<void> => {
	const {
		inputPath,
		outputPath,
		external,
		sourceRoot,
		keepNames,
		footer,
		sourcemap,
		tsconfig,
		requireFix = true,
		minify = true,
		__dirnameFix = true,
		__filenameFix = true,
	} = options;
	let banner: { js: string } | undefined;
	if (__dirnameFix || __filenameFix || requireFix) {
		const dirname = _dirname(inputPath).replace(/\\/g, '\\\\');
		const filename = inputPath.replace(/\\/g, '\\\\');
		let js = '';
		if (__dirnameFix) {
			js += `const __dirname='${dirname}';`;
		}
		if (__filenameFix) {
			js += `const __filename='${filename}';`;
		}
		if (requireFix) {
			js +=
				"import {createRequire} from 'module';const require=createRequire(import.meta.url);";
		}
		banner = {
			js,
		};
	}

	const esbuildOptions: SameShape<BuildOptions, BuildOptions> = {
		banner,
		footer: footer ? { js: footer } : undefined,
		bundle: true,
		entryPoints: [inputPath],
		format: 'esm',
		external,
		minify,
		sourcemap,
		treeShaking: true,
		tsconfig,
		outfile: outputPath,
		platform: 'node',
		target: `node${options.nodeVersion}`,
		keepNames,
		sourceRoot,
	} as const;

	logger.debug('executeEsbuild:build', esbuildOptions);

	const result = await build(esbuildOptions);

	if (result.errors?.length) {
		throw new Error(result.errors[0].text);
	}
};
