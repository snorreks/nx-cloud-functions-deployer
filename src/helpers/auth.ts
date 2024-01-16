/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AuthTriggerOptions } from '$types';
import type { EventContext } from 'firebase-functions';
import type { UserRecord } from 'firebase-functions/v1/auth';
import type {
	AuthUserRecord,
	AuthEventContext,
	BeforeCreateResponse,
	BeforeSignInResponse,
} from 'node_modules/firebase-functions/lib/common/providers/identity';

/**
 * Responds to the creation of a Firebase Auth user.
 *
 * @param handler Event handler that responds to the creation of a Firebase Auth
 *   user.
 */
export const onAuthCreate = (
	handler: (
		user: UserRecord,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: AuthTriggerOptions,
) => handler;
/**
 * Responds to the deletion of a Firebase Auth user.
 *
 * @param handler Event handler that responds to the deletion of a Firebase Auth
 *   user.
 */
export const onAuthDelete = (
	handler: (
		user: UserRecord,
		context: EventContext,
	) => PromiseLike<unknown> | unknown,
	_options?: AuthTriggerOptions,
) => handler;
/**
 * Blocks request to create a Firebase Auth user.
 *
 * @param handler Event handler that blocks creation of a Firebase Auth user.
 */
export const beforeAuthCreate = (
	handler: (
		user: AuthUserRecord,
		context: AuthEventContext,
	) =>
		| BeforeCreateResponse
		| void
		| Promise<BeforeCreateResponse>
		| Promise<void>,
	_options?: AuthTriggerOptions,
) => handler;
/**
 * Blocks request to sign-in a Firebase Auth user.
 *
 * @param handler Event handler that blocks sign-in of a Firebase Auth user.
 */
export const beforeAuthSignIn = (
	handler: (
		user: AuthUserRecord,
		context: AuthEventContext,
	) =>
		| BeforeSignInResponse
		| void
		| Promise<BeforeSignInResponse>
		| Promise<void>,
	_options?: AuthTriggerOptions,
) => handler;
