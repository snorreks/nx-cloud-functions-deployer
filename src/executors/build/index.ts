import type { Executor } from '@nrwl/devkit';
import type { BuildExecutorOptions } from '$types';
import {
	executeEsbuild,
	getAlias,
	logger,
	runCommand,
	validateProject,
} from '$utils';
import { emptyDir } from 'fs-extra';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const executor: Executor<BuildExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

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

	const setOutputDirectory = async () => {
		if (options.clear === false) {
			await mkdir(outputRoot, { recursive: true });
		} else {
			await emptyDir(outputRoot);
		}
	};

	const [alias] = await Promise.all([
		getAlias({ projectRoot, workspaceRoot, tsconfig: options.tsconfig }),
		setOutputDirectory(),
		validateProject({
			packageManager: options.packageManager ?? 'pnpm',
			projectRoot,
			validate: options.validate,
			tsconfig: options.tsconfig,
		}),
	]);
	const main = `index.${options.extension ?? 'js'}`;

	const createPackageJson = async () => {
		if (options.createPackageJson === false) {
			return;
		}

		const newPackageJson: Record<string, unknown> = {
			type: 'module',
			main,
		};

		if (options.nodeVersion) {
			newPackageJson.engines = {
				node: options.nodeVersion,
			};
		}

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
			...options,
			inputPath,
			outputPath: join(outputRoot, main),
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
