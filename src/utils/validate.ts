import type {
	DeployFunction,
	FirestoreFunction,
	StorageFunction,
	DatabaseFunction,
	SchedulerFunction,
	FunctionBuilder,
	DeployDirectory,
	HttpsFunction,
} from '$types';
import {
	firestoreFunctions,
	storageFunctions,
	databaseFunctions,
	httpsFunctions,
	schedulerFunctions,
	functionBuilders,
	deployDirectories,
	functions,
} from '$constants';

export const isDeployFunction = (
	deployFunction: unknown,
): deployFunction is DeployFunction =>
	functions.includes(deployFunction as DeployFunction);

export const isFirestoreFunction = (
	deployFunction: DeployFunction,
): deployFunction is FirestoreFunction =>
	firestoreFunctions.includes(deployFunction as FirestoreFunction);

export const isStorageFunction = (
	deployFunction: DeployFunction,
): deployFunction is StorageFunction =>
	storageFunctions.includes(deployFunction as StorageFunction);

export const isDatabaseFunction = (
	deployFunction: DeployFunction,
): deployFunction is DatabaseFunction =>
	databaseFunctions.includes(deployFunction as DatabaseFunction);

export const isHttpsFunction = (
	deployFunction: DeployFunction,
): deployFunction is HttpsFunction =>
	httpsFunctions.includes(deployFunction as HttpsFunction);

export const isSchedulerFunction = (
	deployFunction: DeployFunction,
): deployFunction is SchedulerFunction =>
	schedulerFunctions.includes(deployFunction as SchedulerFunction);

export const isFunctionBuilder = (
	functionBuilder: string,
): functionBuilder is FunctionBuilder =>
	functionBuilders.includes(functionBuilder as FunctionBuilder);

export const isDeployDirectory = (
	deployFunction: string,
): deployFunction is DeployDirectory =>
	deployDirectories.includes(deployFunction as DeployDirectory);
