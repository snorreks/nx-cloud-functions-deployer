export interface FunctionsCache {
	[functionName: string]: string;
}

/**
 * Having a cloud-cache.ts file in the root of the project allows you to fetch
 * and update the cloud cache.
 *
 * The name of the function has to be `fetch` and the return type has to be
 * `FunctionsCache | undefined`.
 *
 * @example export const fetch: FunctionsCacheFetch = async () => {
 *
 * const doc = await db.doc('cloudCache').get();
 *
 * return doc.data() as FunctionsCache; };
 */
export type FunctionsCacheFetch = (options: {
	flavor: string;
}) => Promise<FunctionsCache | undefined>;

/**
 * Having a cloud-cache.ts file in the root of the project allows you to fetch
 * and update the cloud cache.
 *
 * The name of the function has to be `update` and the parameter type has to be
 * `FunctionsCache`.
 */
export type FunctionsCacheUpdate = (options: {
	newFunctionsCache: FunctionsCache;
	flavor: string;
}) => Promise<void>;
