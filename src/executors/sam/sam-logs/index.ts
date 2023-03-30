import { getFlavor, logger, runCommand } from '$utils';
import type { Executor } from '@nrwl/devkit';
import { join } from 'node:path';

// See https://github.com/studds/nx-aws/blob/main/packages/sam/src/builders/cloudformation/package/package.ts
export interface ExecutorOptions {
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;
	flavors: Record<string, string>;

	stackNames: Record<string, string>;

	lambdaNames?: Record<string, string>;

	/** The flavor of the project */
	flavor?: string;
}

const executor: Executor<ExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const { projectName, root: workspaceRoot, workspace } = context;

	const { stackNames, lambdaNames } = options;

	logger.debug('getBaseOptions', options);

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!workspace) {
		throw new Error('Workspace is not defined');
	}

	const flavor = getFlavor(options);

	const stackName = stackNames[flavor];
	if (!stackName) {
		throw new Error(`Stack name is not defined for flavor ${flavor}`);
	}

	const relativeProjectPath = workspace.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);
	const commandArguments = ['logs', '--stack-name', stackName];

	const lambdaName = lambdaNames?.[flavor];

	if (lambdaName) {
		commandArguments.push('--name', lambdaName);
	}

	console.info(`Executing aws:logs...`);

	await runCommand({
		command: 'sam',
		commandArguments,
		cwd: projectRoot,
	});
	return {
		success: true,
	};
};

export default executor;
