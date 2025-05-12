import type { CallableFunctions, RequestFunctions, HttpsOptions } from '$types';
import type { CallableRequest } from 'firebase-functions/v2/https';
import type { Response, Request } from 'express';

interface FirebaseRequest<
	T extends Record<string, string> = Record<string, string>,
	ResBody = unknown,
	ReqBody = unknown,
> extends Request<T, ResBody, ReqBody> {
	/** The wire format representation of the request body. */
	rawBody: Buffer;
}

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
	Params extends Record<string, string> = Record<string, string>,
>(
	handler: (
		request: FirebaseRequest<
			Params,
			AllFunctions[FunctionName][1],
			AllFunctions[FunctionName][0]
		>,
		response: Response<AllFunctions[FunctionName][1]>,
	) => Promise<void> | void,
	_options?: HttpsOptions<FunctionName>,
) => handler;

/**
 * Declares a callable method for clients to call using a Firebase SDK.
 *
 * @param handler - A function that takes a {@link https.CallableRequest}.
 * @param _options - Options to set on this function.
 * @returns A function that you can export and deploy.
 */
export const onCall = <
	AllFunctions extends CallableFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		request: CallableRequest<AllFunctions[FunctionName][0]>,
	) => Promise<AllFunctions[FunctionName][1]> | AllFunctions[FunctionName][1],
	_options?: HttpsOptions<FunctionName>,
) => handler;
