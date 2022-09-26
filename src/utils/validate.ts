import type {
	DeployFunction,
	DocumentTriggerFunction,
	ObjectTriggerFunction,
	RefTriggerFunction,
	HttpsFunction,
	PubsubFunction,
	FunctionBuilder,
	DeployDirectory,
	BaseFunctionOptions,
	HttpsV2Options,
	HttpsV1Options,
	HttpsV2Function,
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
} from '$constants';

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

export const isV2Function = (
	deployFunction: Omit<BaseFunctionOptions, 'region'>,
): deployFunction is HttpsV2Options => !!(deployFunction as HttpsV2Options).v2;

export const isV1unction = (
	deployFunction: BaseFunctionOptions,
): deployFunction is HttpsV1Options => !(deployFunction as HttpsV1Options).v2;
