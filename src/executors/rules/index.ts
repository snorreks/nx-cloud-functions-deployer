import type { Executor } from '@nx/devkit';
import { join } from 'node:path';
import type { PackageManager } from '$types';
import { logger, getFlavor, getFirebaseProjectId, execute } from '$utils';

interface DeployRulesOptions {
	/** Don't log anything */
	silent?: boolean;
	/** Get verbose logs */
	verbose?: boolean;
	flavors: Record<string, string>;
	/** The flavor of the project */
	flavor?: string;

	packageManager?: PackageManager;

	firebaseJsonPath?: string;

	only?: string[];
}

const executor: Executor<DeployRulesOptions> = async (options, context) => {
	logger.setLogSeverity(options);
	logger.debug('getBaseOptions', options);

	const {
		projectName,
		root: workspaceRoot,
		projectsConfigurations,
	} = context;

	if (!projectName) {
		throw new Error('Project name is not defined');
	}
	if (!projectsConfigurations) {
		throw new Error('projectsConfigurations is not defined');
	}

	const flavor = getFlavor(options);

	const firebaseProjectId = getFirebaseProjectId({
		flavors: options.flavors,
		flavor,
	});

	if (!firebaseProjectId) {
		throw new Error(
			`firebaseProject${
				flavor.charAt(0).toUpperCase() + flavor.slice(1)
			}Id is required`,
		);
	}

	const relativeProjectPath =
		projectsConfigurations.projects[projectName].root;
	const projectRoot = join(workspaceRoot, relativeProjectPath);
	const packageManager = options.packageManager ?? 'pnpm';

	const commandArguments: string[] = [
		'firebase',
		'deploy',
		'--only',
		options.only ? options.only.join(',') : 'firestore,storage',
		'--project',
		firebaseProjectId,
	];

	if (options.firebaseJsonPath) {
		commandArguments.push('--config', options.firebaseJsonPath);
	}

	await execute({
		packageManager,
		commandArguments,
		cwd: projectRoot,
	});

	return {
		success: true,
	};
};

export default executor;
