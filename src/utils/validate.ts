import type {
	DeployFunction,
	DocumentTriggerFunction,
	ObjectTriggerFunction,
	RefTriggerFunction,
	HttpsFunction,
	PubsubFunction,
	FunctionBuilder,
	DeployDirectory,
	HttpsV2Function,
	FunctionV2,
} from '$types';
import {
	documentTriggerFunctions,
	objectTriggerFunctions,
	refTriggerFunctions,
	httpsFunctions,
	pubsubFunctions,
	functionBuilders,
	deployDirectories,
	httpsV2Functions,
	functions,
	functionsV2,
} from '$constants';

export const isDeployFunction = (
	deployFunction: unknown,
): deployFunction is DeployFunction =>
	functions.includes(deployFunction as DeployFunction);

export const isDocumentTriggerFunction = (
	deployFunction: DeployFunction,
): deployFunction is DocumentTriggerFunction =>
	documentTriggerFunctions.includes(
		deployFunction as DocumentTriggerFunction,
	);

export const isObjectTriggerFunction = (
	deployFunction: DeployFunction,
): deployFunction is ObjectTriggerFunction =>
	objectTriggerFunctions.includes(deployFunction as ObjectTriggerFunction);

export const isRefTriggerFunction = (
	deployFunction: DeployFunction,
): deployFunction is RefTriggerFunction =>
	refTriggerFunctions.includes(deployFunction as RefTriggerFunction);

export const isHttpsFunction = (
	deployFunction: DeployFunction,
): deployFunction is HttpsFunction =>
	httpsFunctions.includes(deployFunction as HttpsFunction);

export const isHttpsV2Function = (
	deployFunction: DeployFunction,
): deployFunction is HttpsV2Function =>
	httpsV2Functions.includes(deployFunction as HttpsV2Function);

export const isV2Function = (
	deployFunction: DeployFunction,
): deployFunction is FunctionV2 =>
	functionsV2.includes(deployFunction as FunctionV2);

export const isPubsubFunction = (
	deployFunction: DeployFunction,
): deployFunction is PubsubFunction =>
	pubsubFunctions.includes(deployFunction as PubsubFunction);

export const isFunctionBuilder = (
	functionBuilder: string,
): functionBuilder is FunctionBuilder =>
	functionBuilders.includes(functionBuilder as FunctionBuilder);

export const isDeployDirectory = (
	deployFunction: string,
): deployFunction is DeployDirectory =>
	deployDirectories.includes(deployFunction as DeployDirectory);
