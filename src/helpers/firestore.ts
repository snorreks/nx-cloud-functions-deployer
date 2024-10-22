/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CoreData, DocumentOptions } from '$types';
import type { ParamsOf } from 'firebase-functions/v2/core';
import {
	Change,
	type DocumentSnapshot,
	type FirestoreEvent,
	type QueryDocumentSnapshot,
} from 'firebase-functions/v2/firestore';

/** Respond only to document creations. */
export const onDocumentCreated = <Document extends string = string>(
	handler: (
		event: FirestoreEvent<
			QueryDocumentSnapshot | undefined,
			ParamsOf<Document>
		>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => handler;

/** Respond only to document deletions. */
export const onDocumentDeleted = <Document extends string = string>(
	handler: (
		event: FirestoreEvent<
			QueryDocumentSnapshot | undefined,
			ParamsOf<Document>
		>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => handler;

/** Respond only to document updates. */
export const onDocumentUpdated = <Document extends string = string>(
	handler: (
		event: FirestoreEvent<
			Change<QueryDocumentSnapshot> | undefined,
			ParamsOf<Document>
		>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => handler;

/** Respond to all document writes (creates, updates, or deletes). */
export const onDocumentWritten = <Document extends string = string>(
	handler: (
		event: FirestoreEvent<
			Change<DocumentSnapshot> | undefined,
			ParamsOf<Document>
		>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => handler;

/** Respond only to document creations. */
export const onCreated = <T extends CoreData>(
	handler: (event: FirestoreEvent<T>) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => {
	return (
		event: FirestoreEvent<
			QueryDocumentSnapshot | undefined,
			ParamsOf<string>
		>,
	) => {
		if (!event.data) {
			throw new Error('No data found in event');
		}

		return handler({
			...event,
			data: toCoreData<T>(event.data),
		});
	};
};

/** Respond only to document deletions. */
export const onDeleted = <T extends CoreData>(
	handler: (event: FirestoreEvent<T>) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => {
	return (
		event: FirestoreEvent<
			QueryDocumentSnapshot | undefined,
			ParamsOf<string>
		>,
	) => {
		if (!event.data) {
			throw new Error('No data found in event');
		}

		return handler({
			...event,
			data: toCoreData<T>(event.data),
		});
	};
};

/** Respond only to document updates. */
export const onUpdated = <T extends CoreData>(
	handler: (
		event: FirestoreEvent<{
			before: T;
			after: T;
		}>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => {
	return (
		event: FirestoreEvent<
			Change<QueryDocumentSnapshot> | undefined,
			ParamsOf<string>
		>,
	) => {
		if (!event.data?.after || !event.data?.before) {
			throw new Error('No data found in event');
		}

		return handler({
			...event,
			data: {
				before: toCoreData<T>(event.data.before),
				after: toCoreData<T>(event.data.after),
			},
		});
	};
};

/** Respond to all document writes (creates, updates, or deletes). */
export const onWritten = <T extends CoreData>(
	handler: (
		event: FirestoreEvent<{
			before?: T;
			after?: T;
		}>,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentOptions,
) => {
	return (
		event: FirestoreEvent<
			Change<DocumentSnapshot> | undefined,
			ParamsOf<string>
		>,
	) => {
		return handler({
			...event,
			data: {
				before: event.data?.before
					? toCoreData<T>(event.data.before)
					: undefined,
				after: event.data?.after
					? toCoreData<T>(event.data.after)
					: undefined,
			},
		});
	};
};

const toCoreData = <T extends CoreData>(documentSnap: DocumentSnapshot): T =>
	({
		...documentSnap.data(),
		id: documentSnap.id,
	}) as T;
