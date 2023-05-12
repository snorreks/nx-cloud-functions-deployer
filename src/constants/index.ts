export * from './function-types';

export const functionBuilders = [
	'https',
	'firestore',
	'scheduler',
	'storage',
	'database',
] as const;

export const deployDirectories = [
	'api',
	'https',
	'callable',
	'database',
	'firestore',
	'scheduler',
	'storage',
] as const;
