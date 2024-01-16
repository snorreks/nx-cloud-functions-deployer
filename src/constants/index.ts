export * from './function-types';

export const functionBuilders = [
	'https',
	'firestore',
	'scheduler',
	'storage',
	'database',
	'auth',
] as const;

export const deployDirectories = [
	'api',
	'https',
	'callable',
	'database',
	'auth',
	'firestore',
	'scheduler',
	'storage',
] as const;
