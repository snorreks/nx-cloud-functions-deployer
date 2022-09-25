import type { BuildFunctionData, DeployFunctionData } from '$types';
import { execute, logger } from '$utils';

/**
 * Deploy the function deploy with firebase-tools
 *
 * @param deployFunctionData The metadata of the function to deploy
 */
export const deployFunction = async (
	deployFunctionData: DeployFunctionData,
): Promise<DeployFunctionData | undefined> => {
	const functionName = deployFunctionData.functionName;
	try {
		await executeFirebaseDeploy(deployFunctionData);

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
	});
};
