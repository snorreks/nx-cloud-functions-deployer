import { onUpdated } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onUpdated<UserData>(({ data }) => {
	const beforeUser = data.before;
	const afterUser = data.after;
	console.log(`User ${beforeUser.email} updated to ${afterUser.email}`);
});
