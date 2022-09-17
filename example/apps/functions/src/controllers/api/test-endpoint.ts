import { onRequest } from 'nx-cloud-functions-deployer';
import type { RequestFunctions } from '@shared/types';
import { helloWorldFromSharedUtils } from '@shared/utils';

// Validate the stripe webhook secret, then call the handler for the event type

export default onRequest<RequestFunctions, 'test'>((request, response) => {
	try {
		request.params.message;
		console.log('test-endpoint', request);
		helloWorldFromSharedUtils();
		response.send({ success: true });

		return;
	} catch (error) {
		console.error(error);
		response.status(400);
		return;
	}
});
