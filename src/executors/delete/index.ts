import type { Executor, ExecutorContext } from '@nx/devkit';
import type { BaseDeployOptions, DeployExecutorOptions } from '$types';
import { logger } from '$utils/logger';

import {
	getOnlineFunctionNames,
	getUnusedFunctionNames,
} from './read-functions';
import { deleteFunctions } from './delete-functions';
import { getBaseOptions } from '../deploy';

interface DeleteFunctionsExecutorOptions extends DeployExecutorOptions {
	deleteAll?: boolean;
}

const getDeleteUnusedFunctionsOptions = (
	options: DeleteFunctionsExecutorOptions,
	context: ExecutorContext,
): Promise<BaseDeployOptions> => {
	return getBaseOptions(options, context);
};

const executor: Executor<DeleteFunctionsExecutorOptions> = async (
	options,
	context,
) => {
	logger.setLogSeverity(options);

	const deleteUnusedFunctionsOptions = await getDeleteUnusedFunctionsOptions(
		options,
		context,
	);

	const functionsToDelete = options.deleteAll
		? await getOnlineFunctionNames(deleteUnusedFunctionsOptions)
		: await getUnusedFunctionNames(deleteUnusedFunctionsOptions);

	logger.info('functionsToDelete', functionsToDelete);

	if (functionsToDelete.length > 0) {
		await deleteFunctions({
			...deleteUnusedFunctionsOptions,
			functionNames: functionsToDelete,
		});
	} else {
		logger.info('No unused functions found');
	}

	return {
		success: true,
	};
};

export default executor;
