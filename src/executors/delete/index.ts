import type { Executor, ExecutorContext } from '@nrwl/devkit';
import type { BaseDeployOptions, DeployExecutorOptions } from '$types';
import { logger } from '$utils/logger';

import { getUnusedFunctionNames } from './read-functions';
import { deleteUnusedFunctions } from './delete-functions';
import { getBaseOptions } from '../deploy';

const getDeleteUnusedFunctionsOptions = (
	options: DeployExecutorOptions,
	context: ExecutorContext,
): Promise<BaseDeployOptions> => {
	return getBaseOptions(options, context);
};

const executor: Executor<DeployExecutorOptions> = async (options, context) => {
	logger.setLogSeverity(options);

	const deleteUnusedFunctionsOptions = await getDeleteUnusedFunctionsOptions(
		options,
		context,
	);

	const unusedFunctionNames = await getUnusedFunctionNames(
		deleteUnusedFunctionsOptions,
	);

	logger.info('unusedFunctionNames', unusedFunctionNames);

	if (unusedFunctionNames.length > 0) {
		await deleteUnusedFunctions({
			...deleteUnusedFunctionsOptions,
			functionNames: unusedFunctionNames,
		});
	} else {
		logger.info('No unused functions found');
	}

	return {
		success: true,
	};
};

export default executor;
