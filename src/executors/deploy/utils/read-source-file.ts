import type {
	DeployableFileData,
	DeployOption,
	DocumentFunctionType,
	RelativeDeployFilePath,
	LimitedRuntimeOptions,
	BaseDeployFunctionOptions,
	RootFunctionBuilder,
	HttpsDeployOptions,
	FirestoreDeployOptions,
	PubsubDeployOptions,
	DeployableFileLiteData,
} from '$types';
import { readFile } from 'fs/promises';
import { documentFunctionTypes } from '../../../constants';

export const getDeployableFileData = async (
	deployableFileLiteData: DeployableFileLiteData,
): Promise<DeployableFileData> => {
	const { absolutePath, functionType, rootFunctionBuilder } =
		deployableFileLiteData;

	let deployOptions = deployableFileLiteData.deployOptions;
	if (!deployOptions) {
		const code = await readFile(absolutePath, 'utf8');
		deployOptions = validateDeployOptions(
			rootFunctionBuilder,
			getDeployOptionsFromCode(code),
		);
	}

	const deployableFileData: DeployableFileData = {
		functionType,
		absolutePath,
		rootFunctionBuilder,
		deployOptions,
		functionName:
			deployOptions?.functionName ??
			getFunctionNameFromPath(absolutePath),
		documentPath: undefined,
	};
	console.log('functionName', deployableFileData.functionName);

	if (
		documentFunctionTypes.includes(
			deployableFileData.functionType as DocumentFunctionType,
		)
	) {
		deployableFileData.documentPath =
			(deployOptions as FirestoreDeployOptions)?.documentPath ??
			getDocumentFromPath(absolutePath);
	}
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

const validateDeployOptions = <T extends RootFunctionBuilder>(
	rootFunctionBuilder: T,
	object?: Record<string, unknown>,
): DeployOption<T> | undefined => {
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

	switch (rootFunctionBuilder) {
		case 'https':
			return getHttpsOptions(baseOptions) as DeployOption<T>;
		case 'firestore':
			return getFirestoreOptions(baseOptions, object) as DeployOption<T>;
		case 'pubsub':
			return getScheduleDeployOptions(
				baseOptions,
				object,
			) as DeployOption<T>;
		default:
			throw new Error('Invalid function type');
	}
};

const getValueFromObject = <Value, Key extends string>(
	object: Record<string, unknown>,
	key: Key,
): Value | undefined => {
	if (!(key in object)) {
		return;
	}

	const value = (object as { [key in Key]: unknown })[key];
	return value as Value;
};

const getHttpsOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
): HttpsDeployOptions => {
	const httpsDeployOptions: HttpsDeployOptions = {
		...baseDeployOptions,
	};
	return httpsDeployOptions;
};

const getFirestoreOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): FirestoreDeployOptions => {
	const firestoreDeployOptions: FirestoreDeployOptions = {
		...baseDeployOptions,
		documentPath: getValueFromObject<'firestore', 'documentPath'>(
			object,
			'documentPath',
		),
	};

	return firestoreDeployOptions;
};

const getScheduleDeployOptions = (
	baseDeployOptions: BaseDeployFunctionOptions,
	object: Record<string, unknown>,
): PubsubDeployOptions => {
	const schedule = getValueFromObject<'pubsub', 'schedule'>(
		object,
		'schedule',
	);
	if (!schedule) {
		throw new Error('Schedule option is required for schedule functions');
	}

	const firestoreDeployOptions: PubsubDeployOptions = {
		...baseDeployOptions,
		schedule,
		topic: getValueFromObject<'pubsub', 'topic'>(object, 'topic'),
		timeZone: getValueFromObject<'pubsub', 'timeZone'>(object, 'timeZone'),
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

const getDocumentFromPath = (absolutePath: string): string | undefined => {
	const relativeFilePath = toRelativeDeployFilePath(absolutePath);
	if (!relativeFilePath.startsWith('database')) {
		return undefined;
	}

	const paths = relativeFilePath.split('/');
	paths.pop(); // Remove updated.ts | created.ts | deleted.ts
	paths.shift(); // Remove database
	return paths.join('/').replaceAll('[', '{').replaceAll(']', '}');
};

const getFunctionNameFromPath = (absolutePath: string) => {
	console.log('getFunctionNameFromPath', absolutePath);
	const relativeFilePath = toRelativeDeployFilePath(absolutePath);
	const paths = relativeFilePath.split('/');
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

export const toRelativeDeployFilePath = (
	absolutePath: string,
): RelativeDeployFilePath => {
	const index = absolutePath.indexOf('controllers');
	if (index === -1) {
		return absolutePath as RelativeDeployFilePath;
	}
	return absolutePath.slice(
		index + 'controllers'.length + 1,
	) as RelativeDeployFilePath;
};
