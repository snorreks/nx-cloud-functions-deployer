import { onSchedule } from 'nx-cloud-functions-deployer';

export default onSchedule(
	(event) => {
		console.log('Daily function triggered', event);
	},
	{ region: 'us-central1', schedule: 'every day 00:00' },
);
