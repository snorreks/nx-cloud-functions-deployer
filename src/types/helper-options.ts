import type { HttpsOptions as FirebaseHttpsOptions } from 'firebase-functions/v2/https';
import type { DocumentOptions as FBDocumentOptions } from 'firebase-functions/v2/firestore';
import type { ReferenceOptions as FBReferenceOptions } from 'firebase-functions/v2/database';

import type { StorageOptions } from 'firebase-functions/v2/storage';
import type { ScheduleOptions as FBScheduleOptions } from 'firebase-functions/v2/scheduler';
import type { GlobalOptions } from 'firebase-functions/v2/options';
export type NodeVersion = '14' | '16' | '18' | '20';

export interface BaseFunctionOptions<T extends string = string>
	extends GlobalOptions {
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
	 * Path to the assets from the project root directory.
	 *
	 * NB this will be placed in the same directory as the function.
	 */
	assets?: string[];

	nodeVersion?: NodeVersion;
}

export interface HttpsOptions<T extends string | number | symbol = string>
	extends Omit<BaseFunctionOptions<Extract<T, string>>, 'region'>,
		FirebaseHttpsOptions {}

export interface DocumentOptions
	extends Omit<BaseFunctionOptions, 'enforceAppCheck'>,
		Omit<FBDocumentOptions, 'document'> {
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
	document?: string;
}

export interface ReferenceOptions
	extends Omit<BaseFunctionOptions, 'enforceAppCheck'>,
		FBReferenceOptions {
	ref: string;
}

export interface ScheduleOptions
	extends BaseFunctionOptions,
		FBScheduleOptions {
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

export interface ObjectTriggerOptions
	extends Omit<BaseFunctionOptions, 'region'>,
		StorageOptions {}

export type FunctionOptions = {
	https: HttpsOptions;
	firestore: DocumentOptions;
	scheduler: ScheduleOptions;
	storage: ObjectTriggerOptions;
	database: ReferenceOptions;
};
