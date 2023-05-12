import { onSchedule } from 'nx-cloud-functions-deployer';

export default onSchedule(
	(context) => {
		console.log('daily', context);
	},
	{
		schedule: 'every day 00:00',
		timeoutSeconds: 540,
		memory: '1GiB',
	},
);
