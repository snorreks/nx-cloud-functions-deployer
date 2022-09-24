import { schedule } from 'nx-cloud-functions-deployer';

export default schedule(
	(context) => {
		console.log('daily', context);
	},
	{
		schedule: 'every day 00:00',
		v2: false,

		runtimeOptions: {
			timeoutSeconds: 60,
			memory: '128MB',
		},
	},
);
