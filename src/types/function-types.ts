import type {
	deployDirectories,
	functions,
	functionBuilders,
	firestoreFunctions,
	storageFunctions,
	schedulerFunctions,
	databaseFunctions,
	httpsFunctions,
} from '../constants';

export type DatabaseFunction = (typeof databaseFunctions)[number];

export type FirestoreFunction = (typeof firestoreFunctions)[number];

export type StorageFunction = (typeof storageFunctions)[number];

export type SchedulerFunction = (typeof schedulerFunctions)[number];

export type Function = (typeof functions)[number];

export type HttpsFunction = (typeof httpsFunctions)[number];

export type DeployFunction = (typeof functions)[number];

export type FunctionBuilder = (typeof functionBuilders)[number];

export type DeployDirectory = (typeof deployDirectories)[number];
