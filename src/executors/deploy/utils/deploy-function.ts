import type { BuildFunctionData, DeployFunctionData } from '$types';
import { execute, logger, runCommand } from '$utils';

/**
 * Deploy the function deploy with firebase-tools
 *
 * @param deployFunctionData The metadata of the function to deploy
 */
export const deployFunction = async (
	deployFunctionData: DeployFunctionData,
): Promise<DeployFunctionData | undefined> => {
	const { functionName, external, outputRoot } = deployFunctionData;
	try {
		if (external && external.length > 0) {
			await runCommand({
				command: 'npm',
				commandArguments: ['install', ...external],
				cwd: outputRoot,
				silent: logger.currentLogSeverity !== 'debug',
			});
		}

		const promises: Promise<unknown>[] = [
			executeFirebaseDeploy(deployFunctionData),
		];

		promises.push(uploadSentrySourceMap(deployFunctionData));

		await Promise.all(promises);

		logger.logFunctionDeployed(
			functionName,
			Date.now() - deployFunctionData.startTime,
		);

		return deployFunctionData;
	} catch (error) {
		const errorMessage = (error as { message?: string } | undefined)
			?.message;

		logger.logFunctionFailed(functionName, errorMessage);
		logger.debug(error);

		return;
	}
};

export const executeFirebaseDeploy = async ({
	firebaseProjectId,
	functionName,
	outputRoot,
	packageManager,
}: BuildFunctionData) => {
	await execute({
		packageManager,
		cwd: outputRoot,
		commandArguments: [
			'firebase',
			'deploy',
			'--only',
			`functions:${functionName}`,
			'--project',
			firebaseProjectId,
		],
		silent: logger.currentLogSeverity !== 'debug',
	});
};

export const uploadSentrySourceMap = async ({
	sentry,
	outputRoot,
	packageManager,
}: BuildFunctionData) => {
	try {
		if (!sentry) {
			return;
		}
		logger.debug('uploadSentrySourceMap', sentry);

		const { release, organization, project, token } = sentry;
		await execute({
			packageManager,
			cwd: outputRoot,
			commandArguments: [
				'sentry-cli',
				'releases',
				'new',
				release,
				'--org',
				organization,
				'--project',
				project,
				'--auth-token',
				token,
			],
		});

		await execute({
			packageManager,
			cwd: outputRoot,
			commandArguments: [
				'sentry-cli',
				'releases',
				'files',
				release,
				'upload-sourcemaps',
				'src',
				'--org',
				organization,
				'--project',
				project,
				'--auth-token',
				token,
			],
		});

		await execute({
			packageManager,
			cwd: outputRoot,
			commandArguments: [
				'sentry-cli',
				'releases',
				'finalize',
				release,
				'--org',
				organization,
				'--project',
				project,
				'--auth-token',
				token,
			],
		});
	} catch (error) {
		logger.error('uploadSentrySourceMap', error);
	}
};
