import type {
	DeployableFileData,
	DeployOption,
	LimitedRuntimeOptions,
	BaseDeployFunctionOptions,
	FirestoreDeployOptions,
	DeployableFileLiteData,
	ScheduleDeployOptions,
	TopicDeployOptions,
	FunctionType,
	RealtimeDatabaseDeployOptions,
} from '$types';
import { logger } from '$utils';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { join } from 'node:path';

export const getDeployableFileData = async (
	deployableFileLiteData: DeployableFileLiteData,
): Promise<DeployableFileData> => {
	const {
		functionType,
		absolutePath,
		rootFunctionBuilder,
		relativeDeployFilePath,
		outputDirectory,
	} = deployableFileLiteData;

	const code = await readFile(absolutePath, 'utf8');
	const deployOptions = validateDeployOptions(
		functionType,
		getDeployOptionsFromCode(code),
	);
	const functionName =
		deployOptions?.functionName ??
		getFunctionNameFromPath(relativeDeployFilePath);

	const deployableFileData: DeployableFileData = {
		...deployableFileLiteData,
		rootFunctionBuilder,
		deployOptions,
		outputRoot: join(outputDirectory, functionName),
		functionName,
		path: undefined,
	};

	if (
		rootFunctionBuilder === 'database' ||
		rootFunctionBuilder === 'firestore'
	) {
		deployableFileData.path =
			(deployOptions as FirestoreDeployOptions)?.documentPath ??
			(deployOptions as RealtimeDatabaseDeployOptions)?.ref ??
			getPath(relativeDeployFilePath);
	}

	logger.spinnerLog(
		` --- ${logger.isDryRun ? 'Building' : 'Deploying'}: ${chalk.bold(
			deployableFileData.functionName,
		)}\n${relativeDeployFilePath}`,
	);

	return deployableFileData;
};

/**
 * Read the source code of a deploy file. And read the last bracket of the file.
 *
 * NB: This requires the deploy file to have the export default function at the
 * end of the file.
 */
const getDeployOptionsFromCode = (
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
		console.error('getDeployOptionsFromCode', error);
		return;
	}
};

const validateDeployOptions = (
	functionType: FunctionType,
	object?: Record<string, unknown>,
): DeployOption | undefined => {
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

	const baseOptions: BaseDeployFunctionOptions = {
		functionName: getValueFromObject(object, 'functionName'),
		region: getValueFromObject(object, 'region'),
		runtimeOptions: getRunTimeDeployOptions(object),
	};

	switch (functionType) {
		case 'onCreate':
		case 'onUpdate':
		case 'onDelete':
		case 'onWrite':
			return getFirestoreOptions(baseOptions, object);
		case 'onRealtimeDatabaseCreate':
		case 'onRealtimeDatabaseUpdate':
		case 'onRealtimeDatabaseDelete':
		case 'onRealtimeDatabaseWrite':
			return getRealtimeDatabaseOptions(baseOptions, object);

		case 'schedule':
			return getScheduleDeployOptions(baseOptions, object);
		case 'topic':
			return getTopicDeployOptions(baseOptions, object);

		default:
			return baseOptions;
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

const getFirestoreOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): FirestoreDeployOptions => {
	const firestoreDeployOptions: FirestoreDeployOptions = {
		...baseDeployOptions,
		documentPath: getValueFromObject<string>(object, 'documentPath'),
	};

	return firestoreDeployOptions;
};

const getRealtimeDatabaseOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): RealtimeDatabaseDeployOptions => {
	const ref = getValueFromObject<string>(object, 'ref');
	if (!ref) {
		throw new Error(
			'Schedule option is required for realtime database functions',
		);
	}

	const firestoreDeployOptions: RealtimeDatabaseDeployOptions = {
		...baseDeployOptions,
		ref,
	};

	return firestoreDeployOptions;
};

const getScheduleDeployOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): ScheduleDeployOptions => {
	const schedule = getValueFromObject<string>(object, 'schedule');
	if (!schedule) {
		throw new Error('Schedule option is required for schedule functions');
	}

	const firestoreDeployOptions: ScheduleDeployOptions = {
		...baseDeployOptions,
		schedule,
		timeZone: getValueFromObject<string>(object, 'timeZone'),
	};

	return firestoreDeployOptions;
};

const getTopicDeployOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): TopicDeployOptions => {
	const topic = getValueFromObject<string>(object, 'topic');
	if (!topic) {
		throw new Error('Topic option is required for topic functions');
	}

	const firestoreDeployOptions: TopicDeployOptions = {
		...baseDeployOptions,
		topic,
	};

	return firestoreDeployOptions;
};

const getRunTimeDeployOptions = (
	object: Record<string, unknown>,
): LimitedRuntimeOptions | undefined => {
	if (!('runtimeOptions' in object)) {
		return;
	}
	const runtimeOptionsObject = object.runtimeOptions as Record<
		string,
		unknown
	>;
	const runtimeOptions: LimitedRuntimeOptions = {
		minInstances: getValueFromObject(runtimeOptionsObject, 'minInstances'),
		maxInstances: getValueFromObject(runtimeOptionsObject, 'maxInstances'),
		memory: getValueFromObject(runtimeOptionsObject, 'memory'),
		timeoutSeconds: getValueFromObject(
			runtimeOptionsObject,
			'timeoutSeconds',
		),
	};

	return runtimeOptions;
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
const getPath = (relativeDeployFilePath: string): string => {
	const paths = relativeDeployFilePath.split('/');
	paths.pop(); // Remove updated.ts | created.ts | deleted.ts
	paths.shift(); // Remove database / firestore
	return paths.join('/').replaceAll('[', '{').replaceAll(']', '}');
};

const getFunctionNameFromPath = (relativeDeployFilePath: string) => {
	const paths = relativeDeployFilePath.split('/');
	paths.shift(); // remove the first element, which is the directory type
	for (const path of paths) {
		if (path.startsWith('[')) {
			// remove form array
			paths.splice(paths.indexOf(path), 1);
		}
	}

	const functionName = paths.join('_').replace(/\.ts$/, '');
	return functionName.replaceAll('-', '_');
};
