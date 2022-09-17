import type {
	DeployableFileData,
	DeployOption,
	DocumentFunctionType,
	FunctionType,
	RelativeDeployFilePath,
	LimitedRuntimeOptions,
	BaseDeployFunctionOptions,
	RootFunctionBuilder,
	HttpsDeployOptions,
	FirestoreDeployOptions,
	PubsubDeployOptions,
} from '$types';
import { readFile } from 'fs/promises';
import { documentFunctionTypes, functionTypes } from '../../../constants';

export const getDeployableFileData = async (
	filePath: string,
): Promise<DeployableFileData> => {
	const code = await readFile(filePath, 'utf8');
	const functionType =
		getFunctionTypeFromCode(code) ?? getFunctionTypeFromPath(filePath);

	const rootFunctionBuilder = toRootFunctionType(functionType);

	const deployOptions = validateDeployOptions(
		rootFunctionBuilder,
		getDeployOptionsFromCode(code),
	);

	const deployableFileData: DeployableFileData = {
		absolutePath: filePath,
		functionType,
		deployOptions,
		rootFunctionBuilder,
		functionName:
			deployOptions?.functionName ?? getFunctionNameFromPath(filePath),
		documentPath: undefined,
	};

	if (
		documentFunctionTypes.includes(
			deployableFileData.functionType as DocumentFunctionType,
		)
	) {
		deployableFileData.documentPath =
			(deployOptions as FirestoreDeployOptions)?.documentPath ??
			getDocumentFromPath(filePath);
	}
	return deployableFileData;
};

const toRootFunctionType = (
	functionType: FunctionType,
): RootFunctionBuilder => {
	switch (functionType) {
		case 'onCreate':
		case 'onUpdate':
		case 'onDelete':
			return 'firestore';
		case 'onCall':
		case 'onRequest':
			return 'https';
		case 'schedule':
			return 'pubsub';
		default:
			throw new Error('Invalid function type');
	}
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

/**
 * Get the function type from the code of a deploy file.
 *
 * It reads what is after the `export default` and returns the function type.
 *
 * @param code The code of the deploy file
 * @returns The function type
 */
const getFunctionTypeFromCode = (code: string): FunctionType | undefined => {
	try {
		const exportDefault = code.match(/export default (\w+)\(/);
		if (!exportDefault) {
			return;
		}
		const [, functionType] = exportDefault;
		if (!functionTypes.includes(functionType as FunctionType)) {
			return;
		}
		console.log('getFunctionTypeFromCode', functionType);
		return functionType as FunctionType;
	} catch (error) {
		console.log('getFunctionTypeFromCode', error);
		return;
	}
};

const getFunctionTypeFromPath = (path: string): FunctionType => {
	switch (true) {
		case path.includes('callable'):
			return 'onCall';
		case path.includes('scheduler'):
			return 'schedule';
		case path.includes('storage'):
			throw new Error('Storage functions are not supported yet');
		case path.endsWith('created.ts'):
			return 'onCreate';
		case path.endsWith('updated.ts'):
			return 'onUpdate';
		case path.endsWith('deleted.ts'):
			return 'onDelete';
		default:
			return 'onRequest';
	}
};

const getDocumentFromPath = (filePath: string): string | undefined => {
	const relativeFilePath = toRelativeDeployFilePath(filePath);
	if (!relativeFilePath.startsWith('database')) {
		return undefined;
	}

	const paths = relativeFilePath.split('\\');
	paths.pop(); // Remove updated.ts | created.ts | deleted.ts
	paths.shift(); // Remove database
	return paths.join('/').replaceAll('[', '{').replaceAll(']', '}');
};

const getFunctionNameFromPath = (filePath: string) => {
	const relativeFilePath = toRelativeDeployFilePath(filePath);
	const paths = relativeFilePath.split('\\');
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
	filePath: string,
): RelativeDeployFilePath => {
	const index = filePath.indexOf('controllers');
	if (index === -1) {
		return filePath as RelativeDeployFilePath;
	}
	return filePath.slice(
		index + 'controllers'.length + 1,
	) as RelativeDeployFilePath;
};
