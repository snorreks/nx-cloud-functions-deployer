/* eslint-disable @typescript-eslint/no-unused-vars */
import type { EventContext } from 'firebase-functions';
import type { ScheduleOptions, TopicOptions } from '$types';

export const schedule = (
	handler: (context: EventContext) => PromiseLike<unknown> | unknown,
	_options: ScheduleOptions,
) => handler;

/**
 * Select Cloud Pub/Sub topic to listen to.
 *
 * @param topic Name of Pub/Sub topic, must belong to the same project as the
 *   function.
 */
export const topic = (
	handler: (context: EventContext) => PromiseLike<unknown> | unknown,
	_options: TopicOptions,
) => handler;
