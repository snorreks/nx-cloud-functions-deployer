/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Change, EventContext } from 'firebase-functions';
import type { RefTriggerOptions } from '$types';
import type { DataSnapshot } from 'firebase-functions/lib/common/providers/database';

/**
 * Event handler that fires every time new data is created in Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time new data is created in
 *   Firebase Realtime Database.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onRefCreate = (
	handler: (
		snapshot: DataSnapshot,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RefTriggerOptions,
) => handler;

/**
 * Event handler that fires every time data is deleted from Firebase Realtime
 * Database.
 *
 * @param handler Event handler that runs every time data is deleted from
 *   Firebase Realtime Database.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onRefDelete = (
	handler: (
		snapshot: DataSnapshot,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RefTriggerOptions,
) => handler;

/**
 * Event handler that fires every time data is updated in Firebase Realtime
 * Database.
 *
 * @param handler Event handler which is run every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud DeployFunction which you can export and deploy.
 */
export const onRefUpdate = (
	handler: (
		change: Change<DataSnapshot>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RefTriggerOptions,
) => handler;

/**
 * Event handler that fires every time a Firebase Realtime Database write of any
 * kind (creation, update, or delete) occurs.
 *
 * @param handler Event handler that runs every time a Firebase Realtime
 *   Database write occurs.
 * @returns A Cloud DeployFunction that you can export and deploy.
 */
export const onRefWrite = (
	handler: (
		change: Change<DataSnapshot>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options: RefTriggerOptions,
) => handler;
