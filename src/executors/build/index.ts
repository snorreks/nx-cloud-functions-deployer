import type { Executor } from '@nrwl/devkit';
import type { BuildExecutorOptions } from '$types';
import { executeEsbuild, runCommand } from '$utils';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { getEsbuildAliasFromTsConfig } from '../deploy/utils/read-project';

const executor: Executor<BuildExecutorOptions> = async (options, context) => {
	const { projectName, root: workspaceRoot, workspace } = context;

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!workspace) {
		throw new Error('Workspace is not defined');
	}

	const relativeProjectPath = workspace.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);

	const inputRoot = join(projectRoot, options.input);
	const outputRoot = join(projectRoot, options.output);

	const getAlias = async () => {
		let alias = await getEsbuildAliasFromTsConfig(projectRoot);
		if (!alias) {
			alias = await getEsbuildAliasFromTsConfig(
				workspaceRoot,
				'tsconfig.base.json',
			);
		}
		return alias;
	};

	const responseOk = await executeEsbuild({
		inputPath: join(inputRoot, 'src/index.ts'),
		outputPath: join(outputRoot, 'index.js'),
		external: options.external,
		sourceRoot: projectRoot,
		alias: await getAlias(),
	});

	const newPackageJson = {
		type: 'module',
		main: 'index.js',
		engines: {
			node: '16',
		},
	};

	await writeFile(
		join(outputRoot, 'package.json'),
		JSON.stringify(newPackageJson, undefined, 2),
	);

	const external = options?.external;

	if (external && external.length > 0) {
		await runCommand({
			command: 'npm',
			commandArguments: ['install', ...external],
			cwd: outputRoot,
		});
	}

	return {
		success: responseOk,
	};
};

export default executor;
