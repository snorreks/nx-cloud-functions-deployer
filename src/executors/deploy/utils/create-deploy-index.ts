import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	BuildFunctionData,
	DeployExecutorOptions,
	DeployFunction,
	HttpsOptions,
} from '$types';
import { logger, toImportPath } from '$utils';
/** The name of the default exported function */
const functionStart = 'functionStart';

export const createTemporaryIndexFunctionFile = async (
	buildFunctionData: BuildFunctionData,
): Promise<string> => {
	logger.debug('Creating temporary index file', buildFunctionData);
	const code = toDeployIndexCode(buildFunctionData);
	const temporaryFilePath = getTemporaryFilePath(
		buildFunctionData.temporaryDirectory,
		buildFunctionData.functionName,
	);

	await writeFile(temporaryFilePath, code);

	return temporaryFilePath;
};

const getTemporaryFilePath = (
	temporaryDirectory: string,
	functionName: string,
) => join(temporaryDirectory, `${functionName}.ts`);

const toDeployIndexCode = (buildFunctionData: BuildFunctionData) => {
	const {
		functionName,
		absolutePath,
		deployFunction,
		rootFunctionBuilder,
		temporaryDirectory,
	} = buildFunctionData;
	const functionCode = toFunctionCodeType(deployFunction);

	const deployableFilePath = absolutePath;
	const importPath = toImportPath(deployableFilePath, temporaryDirectory);
	const optionsCode = getOptions(buildFunctionData);

	const fileCode = `
		import { ${functionCode} } from 'firebase-functions/v2/${rootFunctionBuilder}';
		import ${functionStart} from '${importPath}';
		export const ${functionName} = ${functionCode}(${optionsCode}, ${functionStart});
	`;

	return fileCode;
};

const getOptions = (buildFunctionData: BuildFunctionData): string => {
	const options = removeAllOtherOptions(buildFunctionData);
	if (
		buildFunctionData.rootFunctionBuilder === 'firestore' &&
		!options.document &&
		buildFunctionData.path
	) {
		options.document = buildFunctionData.path;
	} else if (
		buildFunctionData.rootFunctionBuilder === 'database' &&
		!options.ref &&
		buildFunctionData.path
	) {
		options.ref = buildFunctionData.path;
	}

	const optionsCode = toOptionsCode(options);

	return optionsCode;
};

const toFunctionCodeType = (deployFunction: DeployFunction): string => {
	switch (deployFunction) {
		case 'onCall':
			return 'onCall';
		case 'onRequest':
			return 'onRequest';
		case 'onCreated':
		case 'onDocumentCreated':
			return 'onDocumentCreated';
		case 'onDeleted':
		case 'onDocumentDeleted':
			return 'onDocumentDeleted';
		case 'onUpdated':
		case 'onDocumentUpdated':
			return 'onDocumentUpdated';
		case 'onWritten':
		case 'onDocumentWritten':
			return 'onDocumentWritten';
		case 'onSchedule':
			return 'onSchedule';
		case 'onObjectArchived':
			return 'onObjectArchived';
		case 'onObjectDeleted':
			return 'onObjectDeleted';
		case 'onObjectFinalized':
			return 'onObjectFinalized';
		case 'onObjectMetadataUpdated':
			return 'onObjectMetadataUpdated';
		case 'onValueCreated':
			return 'onValueCreated';
		case 'onValueDeleted':
			return 'onValueDeleted';
		case 'onValueUpdated':
			return 'onValueUpdated';
		case 'onValueWritten':
			return 'onValueWritten';
		default:
			throw new Error(`Unknown function type: ${deployFunction}`);
	}
};

const toOptionsCode = (options: { [key: string]: unknown }): string => {
	let optionsCode = '{';
	for (const [key, value] of Object.entries(options)) {
		if (Array.isArray(value)) {
			optionsCode += `'${key}': [${value
				.map((v) => `${typeof v === 'string' ? `'${v}'` : v}`)
				.join(',')}],`;
			continue;
		}

		if (typeof value === 'object') {
			optionsCode += `'${key}': ${toOptionsCode(
				value as { [key: string]: unknown },
			)},`;
			continue;
		}

		if (
			typeof value !== 'string' &&
			typeof value !== 'number' &&
			typeof value !== 'boolean'
		) {
			continue;
		}

		optionsCode += `'${key}': ${
			typeof value === 'string' ? `'${value}'` : value
		},`;
	}
	optionsCode += '}';
	return optionsCode;
};

const removeAllOtherOptions = (
	buildFunctionData: BuildFunctionData | HttpsOptions,
): Partial<BuildFunctionData & { document?: string; ref?: string }> => {
	const options: { [key: string]: unknown } = {
		...buildFunctionData,
		region: buildFunctionData.region as string,
	};

	const keysToDelete: (
		| keyof BuildFunctionData
		| keyof DeployExecutorOptions
		| string
	)[] = [
		'absolutePath',
		'assets',
		'checksum',
		'cloudCacheFileName',
		'defaultRegion',
		'deployFunction',
		'dryRun',
		'environment',
		'external',
		'keepNames',
		'firebaseProjectId',
		'flavor',
		'force',
		'functionName',
		'functionsDirectory',
		'only',
		'outputDirectory',
		'outputRoot',
		'packageManager',
		'path',
		'projectRoot',
		'relativeDeployFilePath',
		'rootFunctionBuilder',
		'ignoreMissingEnvironmentKey',
		'startTime',
		'temporaryDirectory',
		'tsconfig',
		'validate',
		'workspaceRoot',
		'nodeVersion',
		'flavors',
		'debug',
		'sourcemap',
		'requireFix',
		'verbose',
		'includeFilePath',
		'currentTime',
		'pnpmFix',
	];

	for (const key of keysToDelete) {
		delete options[key];
	}

	return options;
};
