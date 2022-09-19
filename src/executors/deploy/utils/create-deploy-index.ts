import { unlinkSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	DeployableFileData,
	DeployOption,
	FunctionType,
	LimitedRuntimeOptions,
	ScheduleDeployOptions,
	TopicDeployOptions,
} from '$types';
import { logger } from '$utils';
/** The name of the default exported function */
const functionStart = 'functionStart';

export const createTemporaryIndexFunctionFile = async (
	deployableFileData: DeployableFileData,
): Promise<string> => {
	const code = toDeployIndexCode(deployableFileData);
	const temporaryFilePath = getTemporaryFilePath(
		deployableFileData.temporaryDirectory,
		deployableFileData.functionName,
	);

	await createTemporaryFile(temporaryFilePath, code);
	return temporaryFilePath;
};

const getTemporaryFilePath = (
	temporaryDirectory: string,
	functionName: string,
) => join(temporaryDirectory, `${functionName}.ts`);

const toDeployIndexCode = (deployableFileData: DeployableFileData) => {
	const { functionName, absolutePath, deployOptions, defaultRegion } =
		deployableFileData;

	const deployableFilePath = absolutePath;

	const region = deployOptions?.region ?? defaultRegion;

	const pathWithoutSuffix = deployableFilePath.replace('.ts', '');
	const fileCode = `
		import { region } from 'firebase-functions';
		import ${functionStart} from '${pathWithoutSuffix}';
		export const ${functionName} = region('${region}').${getRootFunctionCode(
		deployableFileData,
	)}.${toEndCode(deployableFileData)};
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
			logger.warn(error);
		}
	});

	await writeFile(filePath, code);
};

const getRootFunctionCode = ({
	deployOptions,
	rootFunctionBuilder,
}: DeployableFileData): string => {
	if (!deployOptions?.runtimeOptions) {
		return rootFunctionBuilder;
	}

	const runWithCode = getRunWithCode(deployOptions.runtimeOptions);
	return `${runWithCode}.${rootFunctionBuilder}`;
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

const toEndCode = ({
	deployOptions,
	functionType,
	path,
}: DeployableFileData): string => {
	const functionCode = toFunctionCodeType(functionType);

	switch (functionType) {
		case 'onCall':
		case 'onRequest':
			return `${functionCode}(${functionStart});`;
		case 'onCreate':
		case 'onDelete':
		case 'onUpdate':
		case 'onWrite':
			return `document('${path}').${functionCode}(${functionStart});`;
		case 'onRealtimeDatabaseCreate':
		case 'onRealtimeDatabaseDelete':
		case 'onRealtimeDatabaseUpdate':
		case 'onRealtimeDatabaseWrite':
			return `ref('${path}').${functionCode}(${functionStart});`;

		case 'topic':
			return getTopicDeployCode(deployOptions);
		case 'schedule':
			return getScheduleDeployCode(deployOptions);
		case 'onObjectArchive':
		case 'onObjectDelete':
		case 'onObjectFinalize':
		case 'onObjectMetadataUpdate':
			return `object().${functionCode}(${functionStart});`;

		default:
			throw new Error(`Unknown function type: ${functionType}`);
	}
};

const toFunctionCodeType = (functionType: FunctionType): string => {
	switch (functionType) {
		case 'onCall':
			return 'onCall';
		case 'onRequest':
			return 'onRequest';
		case 'onCreate':
			return 'onCreate';
		case 'onDelete':
			return 'onDelete';
		case 'onUpdate':
			return 'onUpdate';
		case 'onWrite':
			return 'onWrite';
		case 'topic':
			return 'topic';
		case 'schedule':
			return 'schedule';
		case 'onObjectArchive':
			return 'onArchive';
		case 'onObjectDelete':
			return 'onDelete';
		case 'onObjectFinalize':
			return 'onFinalize';
		case 'onObjectMetadataUpdate':
			return 'onMetadataUpdate';
		case 'onRealtimeDatabaseCreate':
			return 'onCreate';
		case 'onRealtimeDatabaseDelete':
			return 'onDelete';
		case 'onRealtimeDatabaseUpdate':
			return 'onUpdate';
		case 'onRealtimeDatabaseWrite':
			return 'onWrite';
		default:
			throw new Error(`Unknown function type: ${functionType}`);
	}
};

const getScheduleDeployCode = (deployOptions?: DeployOption): string => {
	if (!deployOptions) {
		throw new Error('Pubsub deploy options are required');
	}

	const { timeZone, schedule } = deployOptions as ScheduleDeployOptions;
	let pubsubCode = `schedule('${schedule}').`;

	if (timeZone) {
		pubsubCode += `timeZone('${timeZone}').`;
	}

	pubsubCode += `onRun(${functionStart})`;

	return pubsubCode;
};

const getTopicDeployCode = (deployOptions?: DeployOption): string => {
	if (!deployOptions) {
		throw new Error('Pubsub deploy options are required');
	}

	const { topic } = deployOptions as TopicDeployOptions;
	let pubsubCode = `topic('${topic}').`;

	pubsubCode += `onRun(${functionStart})`;

	return pubsubCode;
};
