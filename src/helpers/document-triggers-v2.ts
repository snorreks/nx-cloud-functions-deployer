/* eslint-disable @typescript-eslint/no-unused-vars */
import type { QueryDocumentSnapshot } from '@google-cloud/firestore';
import type { Change, EventContext } from 'firebase-functions';
import type { CoreData, DocumentTriggerOptions } from '$types';
// import  { firestore, ,  } from 'firebase-functions/v2';
// firestore.onDocumentCreated('df', (snapshot, context) => {});
/** Respond only to document creations. */
export const onDocumentCreateV2 = <T>(
	handler: (
		snapshot: QueryDocumentSnapshot<T>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
) => handler;

/** Respond only to document deletions. */
export const onDocumentDeleteV2 = <T>(
	handler: (
		snapshot: QueryDocumentSnapshot<T>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
) => handler;

/** Respond only to document updates. */
export const onDocumentUpdateV2 = <T>(
	handler: (
		change: Change<T>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
) => handler;

/** Respond to all document writes (creates, updates, or deletes). */
export const onDocumentWriteV2 = <T>(
	handler: (
		change: Change<T>,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
) => handler;

/** Respond only to document creations. */
export const onCreateV2 = <T extends CoreData>(
	handler: (data: T, context: EventContext) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
): ((
	snapshot: QueryDocumentSnapshot<Omit<T, 'id'>>,
	context: EventContext,
) => PromiseLike<unknown> | unknown) => {
	return (
		snapshot: QueryDocumentSnapshot<Omit<T, 'id'>>,
		context: EventContext,
	) => {
		return handler(toCoreData(snapshot), context);
	};
};

/** Respond only to document deletions. */
export const onDeleteV2 = <T extends CoreData>(
	handler: (data: T, context: EventContext) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
): ((
	snapshot: QueryDocumentSnapshot<Omit<T, 'id'>>,
	context: EventContext,
) => PromiseLike<unknown> | unknown) => {
	return (
		snapshot: QueryDocumentSnapshot<Omit<T, 'id'>>,
		context: EventContext,
	) => {
		return handler(toCoreData(snapshot), context);
	};
};

/** Respond only to document updates. */
export const onUpdateV2 = <T extends CoreData>(
	handler: (
		change: { beforeData: T; afterData: T },
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
): ((
	change: Change<QueryDocumentSnapshot<Omit<T, 'id'>>>,
	context: EventContext,
) => PromiseLike<unknown> | unknown) => {
	return (
		change: Change<QueryDocumentSnapshot<Omit<T, 'id'>>>,
		context: EventContext,
	) => {
		return handler(
			{
				beforeData: toCoreData(change.before),
				afterData: toCoreData(change.after),
			},
			context,
		);
	};
};

/** Respond to all document writes (creates, updates, or deletes). */
export const onWriteV2 = <T extends CoreData>(
	handler: (
		change: { beforeData?: T; afterData?: T },
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: DocumentTriggerOptions,
): ((
	change: Change<QueryDocumentSnapshot<Omit<T, 'id'>>>,
	context: EventContext,
) => PromiseLike<unknown> | unknown) => {
	return (
		change: Change<QueryDocumentSnapshot<Omit<T, 'id'>>>,
		context: EventContext,
	) => {
		return handler(
			{
				beforeData: change.before.exists
					? toCoreData(change.before)
					: undefined,
				afterData: change.after.exists
					? toCoreData(change.after)
					: undefined,
			},
			context,
		);
	};
};

export const toCoreData = <T extends CoreData>(
	documentSnap: QueryDocumentSnapshot<Omit<T, 'id'>>,
): T =>
	({
		...documentSnap.data(),
		id: documentSnap.id,
	} as T);
