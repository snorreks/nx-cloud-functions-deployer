/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EventContext } from 'firebase-functions';
import type { ScheduleOptions } from '$types';

export const onSchedule = (
	handler: (context: EventContext) => PromiseLike<unknown> | unknown,
	_options: ScheduleOptions,
) => handler;
