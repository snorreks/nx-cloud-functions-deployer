import { onCreated } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onCreated<UserData>(({ data }) => {
	console.log(`User ${data.email} created`);
});
