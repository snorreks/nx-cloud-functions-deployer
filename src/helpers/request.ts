/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Request, Response } from 'firebase-functions';
import type { HttpsDeployOptions, RequestFunctions } from '$types';

export const onRequest = <
	AllFunctions extends RequestFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		options: Request<AllFunctions[FunctionName][0]>,
		response: Response<AllFunctions[FunctionName][1]>,
	) => Promise<void> | void,
	_options?: HttpsDeployOptions,
): ((options: Request, response: Response) => Promise<void> | void) => handler;
