export interface CloudCache {
	[functionName: string]: string;
}

/**
 * Having a cloud-cache.ts file in the root of the project allows you to fetch
 * and update the cloud cache.
 *
 * The name of the function has to be `fetch` and the return type has to be
 * `CloudCache | undefined`.
 *
 * @example export const fetch: CloudCacheFetch = async () => {
 *
 * const doc = await db.doc('cloudCache').get();
 *
 * return doc.data() as CloudCache; };
 */
export type CloudCacheFetch = () => Promise<CloudCache | undefined>;

/**
 * Having a cloud-cache.ts file in the root of the project allows you to fetch
 * and update the cloud cache.
 *
 * The name of the function has to be `update` and the parameter type has to be
 * `CloudCache`.
 */
export type CloudCacheUpdate = (newCloudCache: CloudCache) => Promise<void>;
