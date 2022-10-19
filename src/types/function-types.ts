import type {
	deployDirectories,
	functions,
	functionBuilders,
	documentTriggerFunctions,
	objectTriggerFunctions,
	pubsubFunctions,
	httpsFunctions,
	refTriggerFunctions,
	httpsV2Functions,
	httpsV1Functions,
	functionsV2,
	objectV1TriggerFunctions,
	objectV2TriggerFunctions,
} from '../constants';

export type RefTriggerFunction = typeof refTriggerFunctions[number];

export type DocumentTriggerFunction = typeof documentTriggerFunctions[number];

export type ObjectTriggerFunction = typeof objectTriggerFunctions[number];

export type PubsubFunction = typeof pubsubFunctions[number];

export type HttpsFunction = typeof httpsFunctions[number];

export type FunctionV2 = typeof functionsV2[number];

export type ObjectV1TriggerFunction = typeof objectV1TriggerFunctions[number];

export type ObjectV2TriggerFunction = typeof objectV2TriggerFunctions[number];

export type HttpsV2Function = typeof httpsV2Functions[number];

export type HttpsV1Function = typeof httpsV1Functions[number];

export type DeployFunction = typeof functions[number];

export type FunctionBuilder = typeof functionBuilders[number];

export type DeployDirectory = typeof deployDirectories[number];
