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
