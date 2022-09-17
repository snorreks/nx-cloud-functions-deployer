import { onCall } from 'nx-cloud-functions-deployer';
import type { CallableFunctions } from '@shared/types';

export default onCall<CallableFunctions, 'test'>(
	(payload, context) => {
		console.log('test-callable', payload, context);
		const uid = context.auth?.uid;
		console.log('uid', uid);
		console.log('message', payload.message);
		return {
			success: true,
		};
	},
	{
		functionName: 'new_name',
	},
);
