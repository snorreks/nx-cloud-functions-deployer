export const functionTypes = [
	'onCall',
	'onRequest',
	'onCreate',
	'onUpdate',
	'onDelete',
	'schedule',
] as const;
export type FunctionType = typeof functionTypes[number];

export const rootFunctionBuilders = ['https', 'firestore', 'pubsub'] as const;
export type RootFunctionBuilder = typeof rootFunctionBuilders[number];

export const deployDirectoryTypes = [
	'api',
	'callable',
	'database',
	'schedulers',
	'storage',
] as const;

export type DeployDirectoryType = typeof deployDirectoryTypes[number];

export type RelativeDeployFilePath = `${DeployDirectoryType}/${string}`;

export type EsbuildAlias = { [key: string]: string };
