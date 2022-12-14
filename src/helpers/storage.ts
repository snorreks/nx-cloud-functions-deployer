/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EventContext } from 'firebase-functions';
import type { ObjectTriggerV1Options } from '$types';
import type { ObjectMetadata } from 'firebase-functions/v1/storage';

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
export const onObjectArchive = (
	handler: (
		object: ObjectMetadata,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerV1Options,
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
export const onObjectDelete = (
	handler: (
		object: ObjectMetadata,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerV1Options,
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
export const onObjectFinalize = (
	handler: (
		object: ObjectMetadata,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerV1Options,
) => handler;

/**
 * Event handler which fires every time the metadata of an existing object
 * changes.
 *
 * @param handler Event handler which is run every time a Google Cloud Storage
 *   metadata update occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onObjectMetadataUpdate = (
	handler: (
		object: ObjectMetadata,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: ObjectTriggerV1Options,
) => handler;
