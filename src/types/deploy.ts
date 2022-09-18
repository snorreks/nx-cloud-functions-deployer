import type { RuntimeOptions, SUPPORTED_REGIONS } from 'firebase-functions';
import type {
	deployDirectories,
	functionTypes,
	functionBuilders,
	firestoreFunctionTypes,
	storageFunctionTypes,
	pubsubFunctionTypes,
	httpsFunctionTypes,
	realtimeDatabaseFunctionTypes,
} from '../constants';
import type { BaseDeployOptions } from './deploy-options';

export type RealtimeDatabaseFunctionType =
	typeof realtimeDatabaseFunctionTypes[number];

export type FirestoreFunctionType = typeof firestoreFunctionTypes[number];

export type StorageFunctionType = typeof storageFunctionTypes[number];

export type PubsubFunctionType = typeof pubsubFunctionTypes[number];

export type HttpsFunctionType = typeof httpsFunctionTypes[number];

export type FunctionType = typeof functionTypes[number];

export type RootFunctionBuilder = typeof functionBuilders[number];

export type DeployDirectory = typeof deployDirectories[number];

export type LimitedRuntimeOptions = Pick<
	RuntimeOptions,
	'minInstances' | 'maxInstances' | 'memory' | 'timeoutSeconds'
>;

export interface BaseDeployFunctionOptions<T extends string = string> {
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
	 * The region to deploy the function to. If not provided it will be the
	 * region set in project.json. If that is not provided it will be
	 * 'us-central1'
	 *
	 * @see https://firebase.google.com/docs/functions/locations
	 */
	region?: typeof SUPPORTED_REGIONS[number] | string;
	/**
	 * The runtime options for the function with `runWith`. If not provided
	 * won't use `runWith`
	 *
	 * @see https://firebase.google.com/docs/functions/manage-functions#set_runtime_options
	 */
	runtimeOptions?: LimitedRuntimeOptions;
}

export type HttpsDeployOptions<T extends string | number | symbol = string> =
	BaseDeployFunctionOptions<Extract<T, string>>;

export interface FirestoreDeployOptions extends BaseDeployFunctionOptions {
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

export interface RealtimeDatabaseDeployOptions
	extends BaseDeployFunctionOptions {
	ref: string;
}

export interface TopicDeployOptions extends BaseDeployFunctionOptions {
	/**
	 * Select Cloud Pub/Sub topic to listen to.
	 *
	 * @param topic Name of Pub/Sub topic, must belong to the same project as
	 *   the function.
	 * @see https://firebase.google.com/docs/functions/pubsub-events
	 */
	topic: string;
}

export interface ScheduleDeployOptions extends BaseDeployFunctionOptions {
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

export type PubsubDeployOptions = TopicDeployOptions | ScheduleDeployOptions;

export type StorageDeployOptions = BaseDeployFunctionOptions;

type DeployOptions = {
	https: HttpsDeployOptions;
	firestore: FirestoreDeployOptions;
	pubsub: PubsubDeployOptions;
	storage: StorageDeployOptions;
	database: RealtimeDatabaseDeployOptions;
};

export type DeployOption<T extends RootFunctionBuilder = RootFunctionBuilder> =
	DeployOptions[T];

export interface DeployableFileLiteData<
	T extends RootFunctionBuilder = RootFunctionBuilder,
> extends BaseDeployOptions {
	/**
	 * The type of the function.
	 *
	 * @see {@link FunctionType}
	 */
	functionType: FunctionType;
	rootFunctionBuilder: T;
	/** The absolute path of the deploy file */
	absolutePath: string;

	relativeDeployFilePath: string;
}

export interface DeployableFileData<
	T extends RootFunctionBuilder = RootFunctionBuilder,
> extends DeployableFileLiteData<T> {
	/** If the type is `onCreate`, `onUpdate`, or `onDelete`, this is required */
	path: T extends 'firestore' | 'database' ? string : undefined;

	/** The name of the function. */
	functionName: string;

	outputRoot: string;

	/**
	 * The options for deploying the function.
	 *
	 * @see {@link BaseDeployFunctionOptions}
	 */
	deployOptions?: DeployOption<T>;
}
