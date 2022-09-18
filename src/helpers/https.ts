/* eslint-disable @typescript-eslint/no-unused-vars */
import type { https, Request, Response } from 'firebase-functions';
import type {
	HttpsDeployOptions,
	CallableFunctions,
	RequestFunctions,
} from '$types';

/**
 * Handle HTTP requests.
 *
 * @param handler A function that takes a request and response object, same
 *   signature as an Express app.
 */
export const onRequest = <
	AllFunctions extends RequestFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		request: Request<AllFunctions[FunctionName][0]>,
		response: Response<AllFunctions[FunctionName][1]>,
	) => Promise<void> | void,
	_options?: HttpsDeployOptions<FunctionName>,
): ((request: Request, response: Response) => Promise<void> | void) => handler;

/**
 * Declares a callable method for clients to call using a Firebase SDK.
 *
 * @param handler A method that takes a data and context and returns a value.
 */
export const onCall = <
	AllFunctions extends CallableFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		data: AllFunctions[FunctionName][0],
		context: https.CallableContext,
	) => Promise<AllFunctions[FunctionName][1]> | AllFunctions[FunctionName][1],
	_options?: HttpsDeployOptions<FunctionName>,
) => handler;
