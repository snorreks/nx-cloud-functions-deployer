import { getEnvironment, getFlavor, logger, runCommand } from '$utils';
import type { Executor } from '@nx/devkit';
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

	/**
	 * The name of the S3 bucket where this command uploads the artifacts that
	 * are referenced in your template.
	 */
	bucket?: string;

	/**
	 * Stringify version of the environment. If this is set, .env files will be
	 * ignored.
	 *
	 * This is useful when you want to deploy using CI/CD and don't want to
	 * store the environment variables in a file.
	 *
	 * @default undefined
	 */
	envString?: string;
}

const getEnvironmentParameters = async (options: {
	flavor: string;
	projectRoot: string;
	envString?: string;
	envFiles?: Record<string, string>;
}): Promise<string | undefined> => {
	const environment = await getEnvironment(options);
	if (!environment) {
		return;
	}

	const parameters = Object.entries(environment)
		.map(([key, value]) => `${key}='${value}'`)
		.join(' ');

	return `" ${parameters} "`;
};

const executor: Executor<ExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const {
		projectName,
		root: workspaceRoot,
		projectsConfigurations,
	} = context;

	const { flavors, templateFile, bucket } = options;

	logger.debug('getBaseOptions', options);

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!projectsConfigurations) {
		throw new Error('projectsConfigurations is not defined');
	}

	const flavor = getFlavor(options);
	const stackName = flavors[flavor];

	if (!stackName) {
		throw new Error(`Stack name is not defined for flavor ${flavor}`);
	}

	const relativeProjectPath =
		projectsConfigurations.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);
	const commandArguments = [
		'deploy',
		'--no-confirm-changeset',
		'--no-fail-on-empty-changeset',
		'--stack-name',
		stackName,
		'--config-env',
		flavor,
		'--capabilities',
		'CAPABILITY_NAMED_IAM',
	];

	if (templateFile) {
		commandArguments.push('--template-file', templateFile);
	}

	if (bucket) {
		commandArguments.push('--s3-bucket', bucket);
	}

	const parameters = await getEnvironmentParameters({
		...options,
		projectRoot,
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
