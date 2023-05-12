import { onDeleted } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onDeleted<UserData>(({ data }) => {
	console.log(`User ${data.email} created`);
});
