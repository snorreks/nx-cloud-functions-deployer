import type { https } from 'firebase-functions';

export default async (
	payload: unknown,
	context: https.CallableContext,
): Promise<string> => {
	console.log('test-callable', payload, context);
	const uid = context.auth?.uid;

	return 'Hello, ' + uid;
};
