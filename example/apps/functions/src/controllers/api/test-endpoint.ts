import type { Request, Response } from 'firebase-functions';
import { helloWorldFromSharedUtils, weDemBoies } from '@shared/utils';
// Validate the stripe webhook secret, then call the handler for the event type
export default async (
	request: Request,
	response: Response<unknown>,
): Promise<void> => {
	try {
		console.log('test-endpoint', request);
		helloWorldFromSharedUtils();
		response.send({ received: true, w: weDemBoies() });

		return;
	} catch (error) {
		console.error(error);
		response.status(400);
		return;
	}
};
