import { onUpdate } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onUpdate<UserData>((change) => {
	const beforeUser = change.beforeData;
	const afterUser = change.afterData;
	console.log(`User ${beforeUser.email} updated to ${afterUser.email}`);
});
