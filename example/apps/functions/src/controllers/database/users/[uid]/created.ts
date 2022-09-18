import { onCreate } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onCreate<UserData>(
	(user) => {
		console.log(`User ${user.email} created`);
	},
	{
		s: '',
	},
);
