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
	functionName?: string;
	region?: typeof SUPPORTED_REGIONS[number] | string;
	runtimeOptions?: LimitedRuntimeOptions;
}

export interface HttpsDeployOptions extends BaseDeployFunctionOptions {
	functionName?: string;
}

export interface FirestoreDeployOptions extends BaseDeployFunctionOptions {
	documentPath?: string;
}

export interface PubsubDeployOptions extends BaseDeployFunctionOptions {
	/**
	 * Select Cloud Pub/Sub topic to listen to.
	 *
	 * @param topic Name of Pub/Sub topic, must belong to the same project as
	 *   the function.
	 */
	topic?: string;
	schedule: string;
	timeZone?: string;
	// retryConfig?: ScheduleRetryConfig;
}

type DeployOptions = {
	https: HttpsDeployOptions;
	firestore: FirestoreDeployOptions;
	pubsub: PubsubDeployOptions;
};

export type DeployOption<T extends RootFunctionBuilder = RootFunctionBuilder> =
	DeployOptions[T];

export interface DeployableFileData<
	T extends RootFunctionBuilder = RootFunctionBuilder,
> {
	/** The absolute path of the deploy file */
	absolutePath: string;
	/** If the type is `onCreate`, `onUpdate`, or `onDelete`, this is required */
	documentPath: T extends 'firestore' ? string : undefined;
	/** The name of the function. */
	functionName: string;
	/**
	 * The type of the function.
	 *
	 * @see {@link FunctionType}
	 */
	functionType: FunctionType;

	rootFunctionBuilder: T;
	/**
	 * The options for deploying the function.
	 *
	 * @see {@link BaseDeployFunctionOptions}
	 */
	deployOptions?: DeployOption<T>;
}
