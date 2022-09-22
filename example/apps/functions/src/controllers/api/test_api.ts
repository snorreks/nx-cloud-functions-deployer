import { onRequest } from 'nx-cloud-functions-deployer';
import type { RequestFunctions } from '@shared/types';
import { helloWorldFromSharedUtils } from '@shared/utils';
import { flavor } from '$configs/environment';

export default onRequest<RequestFunctions, 'test_api'>(
	(request, response) => {
		console.log(`message ${request.params.message} `);

		response.send({
			flavor,
			dataFromSharedLib: helloWorldFromSharedUtils(),
		});
	},
	{
		timeoutSeconds: 60,
		v2: true,
		region: 'europe-west1',
		invoker: 'public',
	},
);
