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

export const objectTriggerFunctions = [
	'onObjectArchive',
	'onObjectDelete',
	'onObjectFinalize',
	'onObjectMetadataUpdate',
] as const;

export const pubsubFunctions = ['schedule', 'topic'] as const;

export const httpsV1Functions = ['onCall', 'onRequest'] as const;

export const httpsV2Functions = ['onCallV2', 'onRequestV2'] as const;

export const httpsFunctions = [
	...httpsV1Functions,
	...httpsV2Functions,
] as const;

export const functions = [
	...refTriggerFunctions,
	...documentTriggerFunctions,
	...objectTriggerFunctions,
	...pubsubFunctions,
	...httpsFunctions,
] as const;
