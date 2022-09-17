/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EventContext } from 'firebase-functions';
import type { PubsubDeployOptions } from '$types';

export const schedule = (
	handler: (context: EventContext) => PromiseLike<unknown> | unknown,
	_options: PubsubDeployOptions,
) => handler;
