import type {
	deployDirectories,
	functions,
	functionBuilders,
	documentTriggerFunctions,
	objectTriggerFunctions,
	pubsubFunctions,
	httpsFunctions,
	refTriggerFunctions,
} from '../constants';

export type RefTriggerFunction = typeof refTriggerFunctions[number];

export type DocumentTriggerFunction = typeof documentTriggerFunctions[number];

export type ObjectTriggerFunction = typeof objectTriggerFunctions[number];

export type PubsubFunction = typeof pubsubFunctions[number];

export type HttpsFunction = typeof httpsFunctions[number];

export type DeployFunction = typeof functions[number];

export type FunctionBuilder = typeof functionBuilders[number];

export type DeployDirectory = typeof deployDirectories[number];
