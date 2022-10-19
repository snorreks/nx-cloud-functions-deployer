export const documentTriggerFunctions = [
	'onCreate',
	'onUpdate',
	'onDelete',
	'onWrite',
	'onDocumentCreate',
	'onDocumentUpdate',
	'onDocumentDelete',
	'onDocumentWrite',
] as const;

export const refTriggerFunctions = [
	'onRefCreate',
	'onRefDelete',
	'onRefUpdate',
	'onRefWrite',
] as const;

export const objectV1TriggerFunctions = [
	'onObjectArchive',
	'onObjectDelete',
	'onObjectFinalize',
	'onObjectMetadataUpdate',
] as const;

export const objectV2TriggerFunctions = [
	'onObjectArchiveV2',
	'onObjectDeleteV2',
	'onObjectFinalizeV2',
	'onObjectMetadataUpdateV2',
] as const;

export const objectTriggerFunctions = [
	...objectV1TriggerFunctions,
	...objectV2TriggerFunctions,
] as const;

export const pubsubFunctions = ['schedule', 'topic'] as const;

export const httpsV1Functions = ['onCall', 'onRequest'] as const;

export const httpsV2Functions = ['onCallV2', 'onRequestV2'] as const;

export const httpsFunctions = [
	...httpsV1Functions,
	...httpsV2Functions,
] as const;

export const functionsV2 = [
	...httpsV2Functions,
	...objectV2TriggerFunctions,
] as const;

export const functions = [
	...refTriggerFunctions,
	...documentTriggerFunctions,
	...objectTriggerFunctions,
	...pubsubFunctions,
	...httpsFunctions,
] as const;
