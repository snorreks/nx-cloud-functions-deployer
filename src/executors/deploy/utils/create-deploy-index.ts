import { unlinkSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	DeployableFileData,
	DeployOption,
	LimitedRuntimeOptions,
	PubsubDeployOptions,
} from '$types';
/** The name of the default exported function */
const functionStart = 'functionStart';

export const createTemporaryIndexFunctionFile = async ({
	deployableFileData,
	region,
	temporaryDirectory,
}: {
	temporaryDirectory: string;
	region: string;
	deployableFileData: DeployableFileData;
}): Promise<string> => {
	const code = toDeployIndexCode({
		deployableFileData,
		region,
	});
	const temporaryFilePath = getTemporaryFilePath(
		temporaryDirectory,
		deployableFileData.functionName,
	);

	await createTemporaryFile(temporaryFilePath, code);
	return temporaryFilePath;
};

const getTemporaryFilePath = (
	temporaryDirectory: string,
	functionName: string,
) => join(temporaryDirectory, `${functionName}.ts`);

const toDeployIndexCode = ({
	deployableFileData,
	region,
}: {
	region: string;
	deployableFileData: DeployableFileData;
}) => {
	const {
		functionName,
		functionType,
		absolutePath,
		documentPath,
		rootFunctionBuilder,
		deployOptions,
	} = deployableFileData;

	const deployableFilePath = absolutePath.replaceAll('\\', '/');

	// const importCodeStartSection = `(await import('${deployableFilePath}')).default`;

	const getRootFunctionCode = (): string => {
		if (!deployOptions?.runtimeOptions) {
			return rootFunctionBuilder;
		}

		const runWithCode = getRunWithCode(deployOptions.runtimeOptions);
		return `${runWithCode}.${rootFunctionBuilder}`;
	};

	const toEndCode = (): string => {
		if (
			['onCreate', 'onUpdate', 'onDelete'].includes(functionType) &&
			!documentPath
		) {
			throw new Error(
				'Document path is required for firestore functions',
			);
		}

		switch (functionType) {
			case 'onCall':
			case 'onRequest':
				return `${functionType}(${functionStart});`;
			case 'onCreate':
			case 'onDelete':
			case 'onUpdate':
				return `document('${documentPath}').${functionType}(${functionStart});`;
			case 'schedule':
				return getPubsubDeployCode(deployOptions);
			default:
				throw new Error(`Unknown function type: ${functionType}`);
		}
	};
	const pathWithoutSuffix = deployableFilePath.replace('.ts', '');
	const fileCode = `
		import { region } from 'firebase-functions';
		import ${functionStart} from '${pathWithoutSuffix}';
		export const ${functionName} = region('${region}').${getRootFunctionCode()}.${toEndCode()};
	`;

	return fileCode;
};

const createTemporaryFile = async (
	filePath: string,
	code: string,
): Promise<void> => {
	process.on('exit', () => {
		try {
			unlinkSync(filePath);
		} catch (error) {
			console.log(error);
		}
	});

	await writeFile(filePath, code);
};

const getRunWithCode = (runtimeOptions: LimitedRuntimeOptions): string => {
	const { minInstances, maxInstances, memory, timeoutSeconds } =
		runtimeOptions;
	let runWithCode = 'runWith({';
	if (minInstances) {
		runWithCode += `minInstances: ${minInstances},`;
	}
	if (maxInstances) {
		runWithCode += `maxInstances: ${maxInstances},`;
	}
	if (memory) {
		runWithCode += `memory: '${memory}',`;
	}
	if (timeoutSeconds) {
		runWithCode += `timeoutSeconds: ${timeoutSeconds},`;
	}
	runWithCode += '})';

	return runWithCode;
};

const getPubsubDeployCode = (deployOptions?: DeployOption): string => {
	if (!deployOptions) {
		throw new Error('Pubsub deploy options are required');
	}

	const { timeZone, schedule, topic } = deployOptions as PubsubDeployOptions;
	let pubsubCode = '';
	if (timeZone) {
		pubsubCode += `timeZone('${timeZone}').`;
	}
	if (schedule) {
		pubsubCode += `schedule('${schedule}').`;
	}
	if (topic) {
		pubsubCode += `topic('${topic}').`;
	}
	pubsubCode += `onRun(${functionStart})`;

	return pubsubCode;
};
