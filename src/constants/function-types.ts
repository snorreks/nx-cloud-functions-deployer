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

export const httpsFunctions = ['onCall', 'onRequest'] as const;

export const functions = [
	...refTriggerFunctions,
	...documentTriggerFunctions,
	...objectTriggerFunctions,
	...pubsubFunctions,
	...httpsFunctions,
] as const;
