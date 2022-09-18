import type { CoreData } from 'nx-cloud-functions-deployer';
export interface UserData extends CoreData {
	email: string;
}
export interface NotificationData extends CoreData {
	message: string;
}

export type CallableFunctions = {
	test_callable: [
		{
			message: string;
		},
		{
			flavor?: string;
			dataFromSharedLib: string;
		},
	];
};

export type RequestFunctions = {
	test_api: [
		{
			message: string;
		},
		{
			flavor?: string;
			dataFromSharedLib: string;
		},
	];
};
