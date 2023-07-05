export type CallableFunctions = {
	[key: string]: [unknown, unknown];
};

export type RequestFunctions = {
	[key: string]: [
		{
			[key: string]: unknown;
		},
		unknown,
	];
};

export interface CoreData {
	/**
	 * The document's ID
	 *
	 * @see https://firebase.google.com/docs/reference/node/firebase.firestore.DocumentSnapshot#id
	 */
	id: string;
}
