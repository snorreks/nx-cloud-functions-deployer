import type { RuntimeOptions, SUPPORTED_REGIONS } from 'firebase-functions';
import type {
	deployDirectoryTypes,
	functionTypes,
	rootFunctionBuilders,
	documentFunctionTypes,
} from '../constants';

export type DocumentFunctionType = typeof documentFunctionTypes[number];

export type FunctionType = typeof functionTypes[number];

export type RootFunctionBuilder = typeof rootFunctionBuilders[number];

export type DeployDirectoryType = typeof deployDirectoryTypes[number];

export type RelativeDeployFilePath = `${DeployDirectoryType}/${string}`;

export type EsbuildAlias = { [key: string]: string };

export type LimitedRuntimeOptions = Pick<
	RuntimeOptions,
	'minInstances' | 'maxInstances' | 'memory' | 'timeoutSeconds'
>;

export interface BaseDeployFunctionOptions {
	/**
	 * The name of the function. If not provided, the name of the function is
	 * the path from the root of the {@link DeployDirectoryType} directory to the
	 * file. Replacing all `/` and `-` with `_`.
	 *
	 * example // controllers/api/stripe/webhook.ts => stripe_webhook
	 *
	 * example // controllers/callable/auth/check-email.ts => auth_check_email
	 */
	functionName?: string;
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

export type HttpsDeployOptions = BaseDeployFunctionOptions;

export interface FirestoreDeployOptions extends BaseDeployFunctionOptions {
	/**
	 * The document path where the function will listen for changed in firestore
	 *
	 * If not provided, the document path is the path from the root of the
	 * {@link DeployDirectoryType} to the file. Replacing all `/` and `-` with
	 * `_`. And replacing all `[]` with `{}`
	 *
	 * example // controllers/database/users/[uid]/created.ts => 'users/{uid}'
	 *
	 * example //
	 * controllers/database/users/[uid]/notifications/[notificationId] =>
	 * 'users/{uid}/notifications/{notificationId}'
	 */
	documentPath?: string;
}

export interface PubsubDeployOptions extends BaseDeployFunctionOptions {
	/**
	 * Select Cloud Pub/Sub topic to listen to.
	 *
	 * @param topic Name of Pub/Sub topic, must belong to the same project as
	 *   the function.
	 * @see https://firebase.google.com/docs/functions/pubsub-events
	 */
	topic?: string;
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

type DeployOptions = {
	https: HttpsDeployOptions;
	firestore: FirestoreDeployOptions;
	pubsub: PubsubDeployOptions;
};

export type DeployOption<T extends RootFunctionBuilder = RootFunctionBuilder> =
	DeployOptions[T];

export interface DeployableFileLiteData<
	T extends RootFunctionBuilder = RootFunctionBuilder,
> {
	/**
	 * The type of the function.
	 *
	 * @see {@link FunctionType}
	 */
	functionType: FunctionType;
	rootFunctionBuilder: T;
	/** The absolute path of the deploy file */
	absolutePath: string;

	/**
	 * The options for deploying the function.
	 *
	 * @see {@link BaseDeployFunctionOptions}
	 */
	deployOptions?: DeployOption<T>;
}

export interface DeployableFileData<
	T extends RootFunctionBuilder = RootFunctionBuilder,
> extends DeployableFileLiteData<T> {
	/** If the type is `onCreate`, `onUpdate`, or `onDelete`, this is required */
	documentPath: T extends 'firestore' ? string : undefined;
	/** The name of the function. */
	functionName: string;
}
