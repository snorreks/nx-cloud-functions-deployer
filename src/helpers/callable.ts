/* eslint-disable @typescript-eslint/no-unused-vars */
import type { https } from 'firebase-functions';
import type { HttpsDeployOptions, CallableFunctions } from '$types';

export const onCall = <
	AllFunctions extends CallableFunctions,
	FunctionName extends keyof AllFunctions,
>(
	handler: (
		options: AllFunctions[FunctionName][0],
		context: https.CallableContext,
	) => Promise<AllFunctions[FunctionName][1]> | AllFunctions[FunctionName][1],
	_options?: HttpsDeployOptions,
) => handler;
