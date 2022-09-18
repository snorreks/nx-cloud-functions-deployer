import { onCall } from 'nx-cloud-functions-deployer';
import type { CallableFunctions } from '@shared/types';
import { helloWorldFromSharedUtils } from '@shared/utils';
import { flavor } from '$configs/environment';

export default onCall<CallableFunctions, 'test_callable'>((data, context) => {
	console.log(`message ${data.message} from ${context.auth?.uid}`);

	return {
		dataFromSharedLib: helloWorldFromSharedUtils(),
		flavor,
	};
});
