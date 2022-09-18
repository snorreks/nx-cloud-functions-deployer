export const firestoreFunctionTypes = [
	'onCreate',
	'onUpdate',
	'onDelete',
	'onWrite',
] as const;

export const realtimeDatabaseFunctionTypes = [
	'onRealtimeDatabaseCreate',
	'onRealtimeDatabaseDelete',
	'onRealtimeDatabaseUpdate',
	'onRealtimeDatabaseWrite',
] as const;

export const storageFunctionTypes = [
	'onObjectArchive',
	'onObjectDelete',
	'onObjectFinalize',
	'onObjectMetadataUpdate',
] as const;

export const pubsubFunctionTypes = ['schedule', 'topic'] as const;

export const httpsFunctionTypes = ['onCall', 'onRequest'] as const;

export const functionTypes = [
	...realtimeDatabaseFunctionTypes,
	...firestoreFunctionTypes,
	...storageFunctionTypes,
	...pubsubFunctionTypes,
	...httpsFunctionTypes,
] as const;

export const functionBuilders = [
	'https',
	'firestore',
	'pubsub',
	'storage',
	'database',
] as const;

export const deployDirectories = [
	'api',
	'https',
	'callable',
	'database',
	'firestore',
	'schedulers',
	'storage',
] as const;
