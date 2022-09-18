/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Change, EventContext } from 'firebase-functions';
import type { RealtimeDatabaseDeployOptions } from '$types';
import type { DataSnapshot } from 'firebase-functions/v1/database';

/**
 * Event handler that fires every time new data is created in Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time new data is created in
 *   Firebase Realtime Database.
 * @returns A Cloud Function that you can export and deploy.
 */
export const onRealtimeDatabaseCreate = (
	handler: (
		snapshot: DataSnapshot,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RealtimeDatabaseDeployOptions,
) => handler;

/**
 * Event handler that fires every time data is deleted from Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time data is deleted from
 *   Firebase Realtime Database.
 * @returns A Cloud Function that you can export and deploy.
 */
export const onRealtimeDatabaseDelete = (
	handler: (
		snapshot: DataSnapshot,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RealtimeDatabaseDeployOptions,
) => handler;

/**
 * Event handler that fires every time data is updated in Firebase Realtime
 * Database.
 *
 * @param handler Event handler which is run every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud Function which you can export and deploy.
 */
export const onRealtimeDatabaseUpdate = (
	handler: (
		change: Change<DataSnapshot>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RealtimeDatabaseDeployOptions,
) => handler;

/**
 * Event handler that fires every time a Firebase Realtime Database write of any
 * kind (creation, update, or delete) occurs.
 *
 * @param handler Event handler that runs every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud Function that you can export and deploy.
 */
export const onRealtimeDatabaseWrite = (
	handler: (
		change: Change<DataSnapshot>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RealtimeDatabaseDeployOptions,
) => handler;
