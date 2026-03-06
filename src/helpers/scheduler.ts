import type { ScheduledEvent } from 'firebase-functions/v2/scheduler';
import type { ScheduleOptions } from '$types';

export const onSchedule = (
	handler: (event: ScheduledEvent) => void | Promise<void>,
	_options: ScheduleOptions,
) => handler;
