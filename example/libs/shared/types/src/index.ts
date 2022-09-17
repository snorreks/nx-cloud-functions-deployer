export type CallableFunctions = {
	test: [
		{
			message: string;
		},
		{
			success: boolean;
		},
	];
};

export type RequestFunctions = {
	test: [
		{
			message: string;
		},
		{
			success: boolean;
		},
	];
};

export interface UserData {
	uid: string;
	name: string;
}

export interface NotificationData {
	id: string;
	message: string;
}
