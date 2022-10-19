import type {
	BuildFunctionData,
	BaseFunctionOptions,
	DocumentTriggerOptions,
	BuildFunctionLiteData,
	ScheduleOptions,
	TopicOptions,
	DeployFunction,
	RefTriggerOptions,
	HttpsOptions,
	HttpsV2Options,
	RuntimeOptions,
} from '$types';
import {
	isDocumentTriggerFunction,
	isHttpsFunction,
	isObjectTriggerFunction,
	isRefTriggerFunction,
	isV2Function,
	logger,
	removeUnderScore,
	toSnakeCase,
} from '$utils';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { join } from 'node:path';

export const getDeployableFileData = async (
	deployableFileLiteData: BuildFunctionLiteData,
	only?: string[],
): Promise<BuildFunctionData | undefined> => {
	const {
		deployFunction,
		defaultRegion,
		absolutePath,
		rootFunctionBuilder,
		relativeDeployFilePath,
		outputDirectory,
	} = deployableFileLiteData;

	const code = await readFile(absolutePath, 'utf8');
	const deployOptions = validateOptions(
		deployFunction,
		getOptionsFromCode(code),
	);
	const functionName =
		deployOptions?.functionName ??
		getFunctionNameFromPath(
			relativeDeployFilePath,
			isV2Function(deployFunction),
		);

	if (only && !only.includes(functionName)) {
		return;
	}

	const buildFunctionData: BuildFunctionData = {
		...deployableFileLiteData,
		...deployOptions,
		rootFunctionBuilder,
		region: (deployOptions?.region as string | undefined) ?? defaultRegion,
		outputRoot: join(outputDirectory, functionName),
		functionName,
		startTime: Date.now(),
		path: undefined,
	};

	if (
		isRefTriggerFunction(buildFunctionData.deployFunction) ||
		isDocumentTriggerFunction(buildFunctionData.deployFunction)
	) {
		buildFunctionData.path =
			(deployOptions as DocumentTriggerOptions)?.documentPath ??
			(deployOptions as RefTriggerOptions)?.ref;
		if (!buildFunctionData.path) {
			const defaultPath = getDefaultPath(relativeDeployFilePath);
			logger.debug(
				`No path found for ${functionName}, using default path ${defaultPath}`,
			);
			buildFunctionData.path = defaultPath;
		}
	}
	if (!only) {
		logger.info(
			`Found function ${chalk.bold(
				buildFunctionData.functionName,
			)} in ${chalk.bold(buildFunctionData.relativeDeployFilePath)}`,
		);
	}

	return buildFunctionData;
};

/**
 * Read the source code of a deploy file. And read the last bracket of the file.
 *
 * NB: This requires the deploy file to have the export default function at the
 * end of the file.
 */
const getOptionsFromCode = (
	code: string,
): Record<string, unknown> | undefined => {
	try {
		// get the string between the brackets
		let strBetweenBracket = getStringBetweenLastBracket(code);
		if (!strBetweenBracket || strBetweenBracket.includes(';')) {
			return;
		}

		strBetweenBracket = strBetweenBracket
			// replace all single quotes with double quotes
			.replaceAll("'", '"')
			// remove trailing commas
			.replaceAll(/,\s*([\]}])/g, '$1');

		const objKeysRegex =
			/({|,)(?:\s*)(?:')?([A-Za-z_$.][A-Za-z0-9_ \-.$]*)(?:')?(?:\s*):/g; // look for object names
		strBetweenBracket = strBetweenBracket.replace(objKeysRegex, '$1"$2":'); // replace all object names with double quoted
		return JSON.parse(strBetweenBracket);
	} catch (error) {
		logger.error('getOptionsFromCode', error);
		return;
	}
};

const validateOptions = (
	deployFunction: DeployFunction,
	object?: Record<string, unknown>,
): BaseFunctionOptions | HttpsOptions | undefined => {
	if (!object) {
		return;
	}
	const functionName: string | undefined = getValueFromObject(
		object,
		'functionName',
	);
	if (functionName && !functionName.match('^([a-zA-Z_$][a-zA-Zd_$]*)$')) {
		throw new Error('Invalid function name');
	}

	const baseOptions: BaseFunctionOptions = {
		functionName: getValueFromObject(object, 'functionName'),
		region: getValueFromObject(object, 'region'),
		external: getValueFromObject(object, 'external'),
		keepNames: getValueFromObject(object, 'keepNames'), // todo add `?? true` when missing env check is implemented
		assets: getValueFromObject(object, 'assets'),
		runtimeOptions: getRunTimeOptions(object),
	};

	switch (true) {
		case isDocumentTriggerFunction(deployFunction):
			return getDocumentTriggerOptions(baseOptions, object);
		case isV2Function(deployFunction):
			return getV2Options(baseOptions, object);
		case isHttpsFunction(deployFunction):
			return getHttpsV1Options(baseOptions);
		case isObjectTriggerFunction(deployFunction):
			return baseOptions;
		case isRefTriggerFunction(deployFunction):
			return getRefTriggerOptions(baseOptions, object);
		case deployFunction === 'schedule':
			return getScheduleOptions(baseOptions, object);
		case deployFunction === 'topic':
			return getTopicOptions(baseOptions, object);
		default:
			throw new Error(`Invalid deploy function: ${deployFunction}`);
	}
};

const getValueFromObject = <Value>(
	object: Record<string, unknown>,
	key: string,
): Value | undefined => {
	if (!(key in object)) {
		return;
	}

	const value = object[key];
	return value as Value;
};

const getDocumentTriggerOptions = (
	baseOptions: BaseFunctionOptions,
	object: Record<string, unknown>,
): DocumentTriggerOptions => {
	const documentOptions: DocumentTriggerOptions = {
		...baseOptions,
		documentPath: getValueFromObject<string>(object, 'documentPath'),
	};

	return documentOptions;
};

const getV2Options = (
	baseOptions: BaseFunctionOptions,
	object: Record<string, unknown>,
): HttpsOptions => {
	const httpsOptions: HttpsV2Options = {
		...object,
		...baseOptions,
		region: getValueFromObject(object, 'region'),
	};
	logger.debug('getV2Options', httpsOptions);
	return httpsOptions;
};

const getHttpsV1Options = (baseOptions: BaseFunctionOptions): HttpsOptions => {
	return {
		...baseOptions,
	};
};

const getRefTriggerOptions = (
	baseOptions: BaseFunctionOptions,
	object: Record<string, unknown>,
): RefTriggerOptions => {
	const ref = getValueFromObject<string>(object, 'ref');
	if (!ref) {
		throw new Error(
			'Schedule option is required for realtime database functions',
		);
	}

	const refOptions: RefTriggerOptions = {
		...baseOptions,
		ref,
	};

	return refOptions;
};

const getScheduleOptions = (
	baseOptions: BaseFunctionOptions,
	object: Record<string, unknown>,
): ScheduleOptions => {
	const schedule = getValueFromObject<string>(object, 'schedule');
	if (!schedule) {
		throw new Error('Schedule option is required for schedule functions');
	}

	const scheduleOptions: ScheduleOptions = {
		...baseOptions,
		schedule,
		timeZone: getValueFromObject<string>(object, 'timeZone'),
	};

	return scheduleOptions;
};

const getTopicOptions = (
	baseOptions: BaseFunctionOptions,
	object: Record<string, unknown>,
): TopicOptions => {
	const topic = getValueFromObject<string>(object, 'topic');
	if (!topic) {
		throw new Error('Topic option is required for topic functions');
	}

	const topicOptions: TopicOptions = {
		...baseOptions,
		topic,
	};

	return topicOptions;
};

const getRunTimeOptions = (
	object: Record<string, unknown>,
): RuntimeOptions | undefined => {
	if (!('runtimeOptions' in object)) {
		return;
	}
	return object.runtimeOptions as RuntimeOptions;
};

const getStringBetweenLastBracket = (code: string) => {
	const lastCloseBracketIndex = code.lastIndexOf('}'); // find first index of `}`
	if (lastCloseBracketIndex === -1) {
		return;
	}
	let openBracketIndex = code.lastIndexOf('{'); // find last index of `{`
	if (openBracketIndex === -1) {
		return;
	}

	let strBetweenLastBrackets = code.slice(
		openBracketIndex,
		lastCloseBracketIndex + 1,
	);
	const checkForNestedBrackets = () => {
		const amountOfOpenBrackets =
			strBetweenLastBrackets.match(/{/g)?.length || 0;
		const amountOfCloseBrackets =
			strBetweenLastBrackets.match(/}/g)?.length || 0;

		if (amountOfOpenBrackets < amountOfCloseBrackets) {
			openBracketIndex = code.lastIndexOf('{', openBracketIndex - 1);
			strBetweenLastBrackets = code.slice(
				openBracketIndex,
				lastCloseBracketIndex + 1,
			);

			checkForNestedBrackets();
		}
	};
	checkForNestedBrackets();
	return strBetweenLastBrackets;
};

/**
 * Use this to get document path / database ref from a relativeDeployFilePath
 *
 * @param relativeDeployFilePath - relative path to deploy file
 * @returns document path / database ref
 */
const getDefaultPath = (relativeDeployFilePath: string): string => {
	const paths = relativeDeployFilePath.split('/');
	paths.pop(); // Remove updated.ts | created.ts | deleted.ts
	paths.shift(); // Remove database / firestore
	return paths.join('/').replaceAll('[', '{').replaceAll(']', '}');
};

const getFunctionNameFromPath = (
	relativeDeployFilePath: string,
	isV2Function?: boolean,
) => {
	const paths = relativeDeployFilePath.split('/');
	paths.shift(); // remove the first element, which is the directory type
	for (const path of paths) {
		if (path.startsWith('[')) {
			// remove form array
			paths.splice(paths.indexOf(path), 1);
		}
	}

	const functionName = toSnakeCase(paths.join('_').replace(/\.ts$/, ''));
	if (isV2Function) {
		return removeUnderScore(functionName);
	}
	return functionName;
};
