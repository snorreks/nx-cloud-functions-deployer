import { onDelete } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onDelete<UserData>((user) => {
	console.log(`User ${user.email} created`);
});
