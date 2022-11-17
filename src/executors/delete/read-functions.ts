import type { BaseDeployOptions } from '$types';
import { logger } from '$utils';
import client from 'firebase-tools';
import { getBuildableFiles } from '../deploy/utils/read-project';

export const getLocalFunctionNames = async (
	options: BaseDeployOptions,
): Promise<string[]> => {
	try {
		const localFunction = await getBuildableFiles(options);
		const localFunctionNames = localFunction.map(
			(functionData) => functionData.functionName,
		);

		logger.log('localFunctionNames', localFunctionNames);
		return localFunctionNames;
	} catch (error) {
		logger.error('getLocalFunctionNames', error);
		throw error;
	}
};

export const getOnlineFunctionNames = async (
	options: BaseDeployOptions,
): Promise<string[]> => {
	try {
		const onlineFunctions = await client.functions.list({
			project: options.firebaseProjectId,
		});
		const onlineFunctionNames = onlineFunctions.map(
			(functionData) => functionData.id,
		);
		logger.log('onlineFunctionNames', onlineFunctionNames);
		return onlineFunctionNames;
	} catch (error) {
		logger.error('getOnlineFunctionNames', error);
		throw error;
	}
};

export const getUnusedFunctionNames = async (
	options: BaseDeployOptions,
): Promise<string[]> => {
	try {
		const [localFunctionNames, onlineFunctionNames] = await Promise.all([
			getLocalFunctionNames(options),
			getOnlineFunctionNames(options),
		]);

		const unusedFunctionNames = onlineFunctionNames.filter(
			(onlineFunctionName) =>
				!localFunctionNames.includes(onlineFunctionName),
		);
		return unusedFunctionNames;
	} catch (error) {
		logger.error('getLocalFunctionNames', error);
		throw error;
	}
};
