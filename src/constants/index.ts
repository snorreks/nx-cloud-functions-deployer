export * from './function-types';

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
