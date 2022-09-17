/* eslint-disable @typescript-eslint/no-unused-vars */
import type { QueryDocumentSnapshot } from '@google-cloud/firestore';
import type { Change, EventContext } from 'firebase-functions';
import type { CoreData, FirestoreDeployOptions } from '$types';

export const onCreate = <T extends CoreData>(
	handler: (data: T, context: EventContext) => PromiseLike<unknown> | unknown,
	_options?: FirestoreDeployOptions,
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

export const onDelete = <T extends CoreData>(
	handler: (data: T, context: EventContext) => PromiseLike<unknown> | unknown,
	_options?: FirestoreDeployOptions,
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

export const onUpdate = <T extends CoreData>(
	handler: (
		change: { before: T; after: T },
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: FirestoreDeployOptions,
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
				before: toCoreData(change.after),
				after: toCoreData(change.after),
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

/*
Old helper methods. I am keeping it here if people want access to snapshot or don't want CoreData type.
	export const onCreate = <T extends DocumentListenerData>(
		handler: (
			snapshot: QueryDocumentSnapshot<T>,
			context: EventContext,
		) => PromiseLike<unknown> | unknown,
		_options?: FirestoreDeployOptions,
	) => handler;
	
	export const onDelete = <T extends DocumentListenerData>(
		handler: (
			snapshot: QueryDocumentSnapshot<T>,
			context: EventContext,
		) => PromiseLike<unknown> | unknown,
		_options?: FirestoreDeployOptions,
	) => handler;
	
	export const onUpdate = <T extends DocumentListenerData>(
		handler: (
			change: Change<QueryDocumentSnapshot<T>>,
			context: EventContext,
		) => PromiseLike<unknown> | unknown,
		_options?: FirestoreDeployOptions,
	) => handler;
	*/
