export const documentFunctionTypes = [
	'onCreate',
	'onUpdate',
	'onDelete',
] as const;

export const functionTypes = [
	...documentFunctionTypes,
	'onCall',
	'onRequest',
	'schedule',
] as const;

export const rootFunctionBuilders = ['https', 'firestore', 'pubsub'] as const;

export const deployDirectoryTypes = [
	'api',
	'callable',
	'database',
	'schedulers',
	'storage',
] as const;
