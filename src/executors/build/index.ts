import type { Executor } from '@nrwl/devkit';
import type { BuildExecutorOptions } from '$types';
import { executeEsbuild, getAlias, runCommand, validateProject } from '$utils';
import { join } from 'path';
import { writeFile, rm, mkdir } from 'fs/promises';

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

	const inputPath = join(projectRoot, options.inputPath ?? 'src/index.ts');
	const outputRoot = join(projectRoot, options.outputRoot ?? 'dist');

	const clearOutputDirectory = async () => {
		if (options.clear === false) {
			return;
		}
		await rm(outputRoot, { recursive: true });
	};

	const [alias] = await Promise.all([
		getAlias({ projectRoot, workspaceRoot, tsconfig: options.tsconfig }),
		clearOutputDirectory(),
		mkdir(outputRoot, { recursive: true }),
		validateProject({
			packageManager: options.packageManager ?? 'pnpm',
			projectRoot,
			validate: options.validate,
			tsconfig: options.tsconfig,
		}),
	]);

	const createPackageJson = async () => {
		if (options.createPackageJson === false) {
			return;
		}

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
	};

	const [responseOk] = await Promise.all([
		executeEsbuild({
			inputPath,
			outputPath: join(outputRoot, 'index.js'),
			external: options.external,
			sourceRoot: projectRoot,
			alias,
			nodeVersion: options.nodeVersion ?? '16',
		}),
		createPackageJson(),
	]);

	return {
		success: responseOk,
	};
};

export default executor;
