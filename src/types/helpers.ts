import type { DocumentData } from '@google-cloud/firestore';

export type CallableFunctions = {
	[key: string]: [unknown, unknown];
};

export type RequestFunctions = {
	[key: string]: [
		{
			[key: string]: string;
		},
		unknown,
	];
};

export type DocumentListenerData = DocumentData;
