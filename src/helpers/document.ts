/* eslint-disable @typescript-eslint/no-unused-vars */
import type { QueryDocumentSnapshot } from '@google-cloud/firestore';
import type { Change, EventContext } from 'firebase-functions';
import type { DocumentListenerData, FirestoreDeployOptions } from '$types';

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
