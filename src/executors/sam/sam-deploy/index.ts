import { getFlavor, logger, runCommand } from '$utils';
import type { Executor } from '@nrwl/devkit';
import { join } from 'node:path';
// See https://github.com/studds/nx-aws/blob/main/packages/sam/src/builders/cloudformation/deploy/deploy.ts
export interface ExecutorOptions {
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;
	flavors: Record<string, string>;

	/** The flavor of the project */
	flavor?: string;
	/** The path where your AWS CloudFormation template is located. */
	templateFile?: string;
	/** The region to deploy this stack */
	region?: string;

	stackNames: Record<string, string>;
}

const getEnvironmentParameters = async ({
	cwd,
	flavor,
}: {
	cwd: string;
	flavor?: string;
}): Promise<string | undefined> => {
	const dotEnvironmentResult = (await import('dotenv')).config({
		path: `${cwd}/.env.${flavor}`,
	});
	const environment = dotEnvironmentResult.parsed;
	if (!environment) {
		return;
	}

	const parameters = Object.entries(environment)
		.map(([key, value]) => `${key}=${value}`)
		.join(' ');
	return `' ${parameters} '`;
};

const executor: Executor<ExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const { projectName, root: workspaceRoot, workspace } = context;

	const { stackNames, templateFile } = options;

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
	const commandArguments = [
		'deploy',
		'--no-confirm-changeset',
		'--no-fail-on-empty-changeset',
		'--stack-name',
		stackName,
		'--config-env',
		flavor,
	];

	if (templateFile) {
		commandArguments.push('--template-file', templateFile);
	}
	const parameters = await getEnvironmentParameters({
		cwd: projectRoot,
		flavor,
	});
	if (parameters) {
		commandArguments.push('--parameter-overrides', parameters);
	}

	logger.info(`Executing aws:deploy...`);

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
