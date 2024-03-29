import type { PackageManager } from '$types';
import { execute, logger } from '$utils';

export const deleteFunctions = async (options: {
	firebaseProjectId: string;
	packageManager: PackageManager;
	functionNames: string[];
}): Promise<void> => {
	try {
		await executeFirebaseFunctionsDelete(options);
	} catch (error) {
		logger.error('deleteFunctions', error);
		throw error;
	}
};

export const executeFirebaseFunctionsDelete = async ({
	firebaseProjectId,
	functionNames,
	packageManager,
}: {
	firebaseProjectId: string;
	packageManager: PackageManager;
	functionNames: string[];
}) => {
	await execute({
		packageManager,
		commandArguments: [
			'firebase',
			'functions:delete',
			...functionNames,
			'--project',
			firebaseProjectId,
		],
	});
};
