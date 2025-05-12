import { onRequest } from 'nx-cloud-functions-deployer';
import type { RequestFunctions } from '@shared/types';
import { helloWorldFromSharedUtils } from '@shared/utils';
import { flavor } from '$configs/environment';

export default onRequest<RequestFunctions, 'test_api', { p: string }>(
	(request, response) => {
		console.log(`message ${request.body.message}`);
		console.log(`params ${request.params.p}`);

		response.send({
			flavor,
			dataFromSharedLib: helloWorldFromSharedUtils(),
		});
	},
	{
		region: 'europe-west1',
	},
);
