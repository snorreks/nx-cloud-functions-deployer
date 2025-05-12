import type {
	DataSnapshot,
	DatabaseEvent,
} from 'firebase-functions/v2/database';
import type { ReferenceOptions } from '$types';
import type { Change, ParamsOf } from 'firebase-functions/v2/core';

/**
 * Event handler that fires every time new data is created in Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time new data is created in
 *   Firebase Realtime Database.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onValueCreated = <Ref extends string = string>(
	handler: (
		event: DatabaseEvent<DataSnapshot, ParamsOf<Ref>>,
	) => PromiseLike<unknown> | unknown,
	_options: ReferenceOptions,
) => handler;

/**
 * Event handler that fires every time data is deleted from Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time data is deleted from
 *   Firebase Realtime Database.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onValueDeleted = <Ref extends string = string>(
	handler: (
		event: DatabaseEvent<DataSnapshot, ParamsOf<Ref>>,
	) => PromiseLike<unknown> | unknown,
	_options: ReferenceOptions,
) => handler;

/**
 * Event handler that fires every time data is updated in Firebase Realtime
 * Database.
 *
 * @param handler Event handler which is run every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onValueUpdated = <Ref extends string = string>(
	handler: (
		event: DatabaseEvent<Change<DataSnapshot>, ParamsOf<Ref>>,
	) => PromiseLike<unknown> | unknown,
	_options: ReferenceOptions,
) => handler;

/**
 * Event handler that fires every time a Firebase Realtime Database write of any
 * kind (creation, update, or delete) occurs.
 *
 * @param handler Event handler that runs every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onValueWritten = <Ref extends string = string>(
	handler: (
		event: DatabaseEvent<Change<DataSnapshot>, ParamsOf<Ref>>,
	) => PromiseLike<unknown> | unknown,
	_options: ReferenceOptions,
) => handler;
