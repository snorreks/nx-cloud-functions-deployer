import type { RuntimeOptions, SUPPORTED_REGIONS } from 'firebase-functions/v1';
import type { HttpsOptions as FirebaseHttpsV2Options } from 'firebase-functions/v2/https';
import type { StorageOptions } from 'firebase-functions/v2/storage';
export type NodeVersion = '14' | '16';

export interface BaseFunctionOptions<T extends string = string> {
	/**
	 * The name of the function. If not provided, the name of the function is
	 * the path from the root of the {@link DeployDirectory} directory to the
	 * file. Replacing all `/` and `-` with `_`.
	 *
	 * example // api/stripe/webhook.ts => stripe_webhook
	 *
	 * example // callable/auth/check-email.ts => auth_check_email
	 */
	functionName?: T;

	/**
	 * Some packages needs to be installed as external dependencies.
	 *
	 * @example external: ['sharp'] // will npm i sharp in dist
	 */
	external?: string[];

	/**
	 * Documentation: https://esbuild.github.io/api/#keep-names
	 *
	 * @default true
	 */
	keepNames?: boolean;

	/**
	 * The region to deploy the function to. If not provided it will be the
	 * region set in project.json. If that is not provided it will be
	 * 'us-central1'
	 *
	 * @see https://firebase.google.com/docs/functions/locations
	 */
	region?: typeof SUPPORTED_REGIONS[number] | string;

	/**
	 * Path to the assets from the project root directory.
	 *
	 * NB this will be placed in the same directory as the function.
	 */
	assets?: string[];

	/**
	 * The runtime options for the function with `runWith`. If not provided
	 * won't use `runWith`.
	 *
	 * Only available for v1 functions.
	 *
	 * @see https://firebase.google.com/docs/functions/manage-functions#set_runtime_options
	 */
	runtimeOptions?: RuntimeOptions;

	nodeVersion?: NodeVersion;
}

export type HttpsV1Options<T extends string | number | symbol = string> =
	BaseFunctionOptions<Extract<T, string>>;

export interface HttpsV2Options<T extends string | number | symbol = string>
	extends Omit<
			BaseFunctionOptions<Extract<T, string>>,
			'region' | 'runtimeOptions'
		>,
		FirebaseHttpsV2Options {}

export type HttpsOptions<T extends string | number | symbol = string> =
	| HttpsV1Options<T>
	| HttpsV2Options<T>;

export interface DocumentTriggerOptions extends BaseFunctionOptions {
	/**
	 * The document path where the function will listen for changed in firestore
	 *
	 * If not provided, the document path is the path from the root of the
	 * {@link DeployDirectory} to the file. Replacing all `/` and `-` with `_`.
	 * And replacing all `[]` with `{}`
	 *
	 * example // database/users/[uid]/created.ts => 'users/{uid}'
	 *
	 * example // database/users/[uid]/notifications/[notificationId] =>
	 * 'users/{uid}/notifications/{notificationId}'
	 */
	documentPath?: string;
}

export interface RefTriggerOptions extends BaseFunctionOptions {
	ref: string;
}

export interface TopicOptions extends BaseFunctionOptions {
	/**
	 * Select Cloud Pub/Sub topic to listen to.
	 *
	 * @param topic Name of Pub/Sub topic, must belong to the same project as
	 *   the function.
	 * @see https://firebase.google.com/docs/functions/pubsub-events
	 */
	topic: string;
}

export interface ScheduleOptions extends BaseFunctionOptions {
	/**
	 * When to execute the function. If the function is a scheduled function,
	 * this property is required.
	 *
	 * @see https://firebase.google.com/docs/functions/schedule-functions
	 */
	schedule: string;
	/** The timezone to use when determining the function's execution time. */
	timeZone?: string;
}

export type PubsubOptions = TopicOptions | ScheduleOptions;

export type ObjectTriggerV1Options = BaseFunctionOptions;

export interface ObjectTriggerV2Options
	extends Omit<BaseFunctionOptions, 'region' | 'runtimeOptions'>,
		StorageOptions {}

export type ObjectTriggerOptions =
	| ObjectTriggerV1Options
	| ObjectTriggerV2Options;

export type FunctionOptions = {
	https: HttpsOptions;
	firestore: DocumentTriggerOptions;
	pubsub: PubsubOptions;
	storage: ObjectTriggerOptions;
	database: RefTriggerOptions;
};

export { RuntimeOptions };
