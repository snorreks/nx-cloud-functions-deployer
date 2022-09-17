// Use these two function to call the backend

import axios from 'axios';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { CallableFunctions, RequestFunctions } from '@shared/types';
/**
 * Call a callable cloud function using axios.
 *
 * @param functionName The functions.httpsCallable function from the firebase
 *   api
 * @param requestData The request data to send to the cloud function
 * @returns The response data that cloud function returns
 */
export const callCloudFunction = async <T extends keyof CallableFunctions>(
	functionName: T,
	requestData: CallableFunctions[T][0],
): Promise<CallableFunctions[T][1]> => {
	const functions = getFunctions();
	const callable = httpsCallable<
		CallableFunctions[T][0],
		CallableFunctions[T][1]
	>(functions, functionName);
	const response = await callable(requestData);
	return response.data;
};

const region = 'us-central1';
const firebaseId = 'localekey-dev';

/**
 * Call a request cloud function using axios.
 *
 * @param functionName The functions.httpsCallable function from the firebase
 *   api
 * @param requestData The request data to send to the cloud function
 * @returns The response data that cloud function returns
 */
export const callAPI = async <T extends keyof RequestFunctions>(
	functionName: T,
	requestData: RequestFunctions[T][0],
): Promise<RequestFunctions[T][1]> => {
	const response = await axios.post(
		`https://${region}-${firebaseId}.cloudfunctions.net/${functionName}`,
		requestData,
	);

	return response.data;
};
