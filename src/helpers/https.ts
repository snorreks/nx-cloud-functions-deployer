/* eslint-disable @typescript-eslint/no-unused-vars */
import type { https, Request, Response } from 'firebase-functions';
import type {
	CallableFunctions,
	RequestFunctions,
	HttpsV2Options,
	HttpsV1Options,
} from '$types';
import type { CallableRequest } from 'firebase-functions/v2/https';

/**
 * Handles HTTPS requests.
 *
 * @param handler - A function that takes a {@link https.Request} and response
 *   object, same signature as an Express app.
 * @param _options - Options to set on this function
 * @returns A function that you can export and deploy.
 */
export const onRequest = <
	AllFunctions extends RequestFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		request: Request<AllFunctions[FunctionName][0]>,
		response: Response<AllFunctions[FunctionName][1]>,
	) => Promise<void> | void,
	_options?: HttpsV1Options<FunctionName>,
): ((request: Request, response: Response) => Promise<void> | void) => handler;

/**
 * Declares a callable method for clients to call using a Firebase SDK.
 *
 * @param handler - A function that takes a {@link CallableRequest}.
 * @param _options - Options to set on this function.
 * @returns A function that you can export and deploy.
 */
export const onCall = <
	AllFunctions extends CallableFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		data: AllFunctions[FunctionName][0],
		context: https.CallableContext,
	) => Promise<AllFunctions[FunctionName][1]> | AllFunctions[FunctionName][1],
	_options?: HttpsV1Options<FunctionName>,
) => handler;

/**
 * Handles HTTPS requests.
 *
 * @param handler - A function that takes a {@link https.Request} and response
 *   object, same signature as an Express app.
 * @param _options - Options to set on this function
 * @returns A function that you can export and deploy.
 */
export const onRequestV2 = <
	AllFunctions extends RequestFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		request: Request<AllFunctions[FunctionName][0]>,
		response: Response<AllFunctions[FunctionName][1]>,
	) => Promise<void> | void,
	_options?: HttpsV2Options<FunctionName>,
): ((request: Request, response: Response) => Promise<void> | void) => handler;

/**
 * Declares a callable method for clients to call using a Firebase SDK.
 *
 * @param handler - A function that takes a {@link https.CallableRequest}.
 * @param _options - Options to set on this function.
 * @returns A function that you can export and deploy.
 */
export const onCallV2 = <
	AllFunctions extends CallableFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		request: CallableRequest<AllFunctions[FunctionName][0]>,
	) => Promise<AllFunctions[FunctionName][1]> | AllFunctions[FunctionName][1],
	_options?: HttpsV2Options<FunctionName>,
) => handler;
