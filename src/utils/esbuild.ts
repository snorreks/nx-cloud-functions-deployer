import { build } from 'esbuild';
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
		minify = true,
	} = options;

	const dirname = _dirname(inputPath).replace(/\\/g, '\\\\');
	const filename = inputPath.replace(/\\/g, '\\\\');

	const banner = {
		js:
			`const __dirname='${dirname}';const __filename='${filename}';` +
			(requireFix
				? "import {createRequire} from 'module';const require=createRequire(import.meta.url);"
				: ''),
	};
	const result = await build({
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
	});

	if (result.errors?.length) {
		throw new Error(result.errors[0].text);
	}
};
