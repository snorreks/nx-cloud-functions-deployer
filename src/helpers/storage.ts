/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ObjectTriggerOptions } from '$types';
import type { StorageEvent } from 'firebase-functions/v2/storage';

/**
 * Event handler sent only when a bucket has enabled object versioning. This
 * event indicates that the live version of an object has become an archived
 * version, either because it was archived or because it was overwritten by the
 * upload of an object of the same name.
 *
 * @param handler Event handler which is run every time a Google Cloud Storage
 *   archival occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onObjectArchived = (
	handler: (event: StorageEvent) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerOptions,
) => handler;
/**
 * Event handler which fires every time a Google Cloud Storage deletion occurs.
 *
 * Sent when an object has been permanently deleted. This includes objects that
 * are overwritten or are deleted as part of the bucket's lifecycle
 * configuration. For buckets with object versioning enabled, this is not sent
 * when an object is archived, even if archival occurs via the
 * `storage.objects.delete` method.
 *
 * @param handler Event handler which is run every time a Google Cloud Storage
 *   deletion occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onObjectDeleted = (
	handler: (event: StorageEvent) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerOptions,
) => handler;

/**
 * Event handler which fires every time a Google Cloud Storage object creation
 * occurs.
 *
 * Sent when a new object (or a new generation of an existing object) is
 * successfully created in the bucket. This includes copying or rewriting an
 * existing object. A failed upload does not trigger this event.
 *
 * @param handler Event handler which is run every time a Google Cloud Storage
 *   object creation occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onObjectFinalized = (
	handler: (event: StorageEvent) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerOptions,
) => handler;

/**
 * Event handler which fires every time the metadata of an existing object
 * changes.
 *
 * @param handler Event handler which is run every time a Google Cloud Storage
 *   metadata update occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onObjectMetadataUpdated = (
	handler: (event: StorageEvent) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerOptions,
) => handler;
