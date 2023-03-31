import type { Handler } from 'aws-lambda';

interface Request {
	type: 'welcome';
}

interface Response {
	success: boolean;
}

export const handler: Handler<Request, Response> = async (event) => {
	console.log('event', event);
	return {
		success: true,
	};
};
