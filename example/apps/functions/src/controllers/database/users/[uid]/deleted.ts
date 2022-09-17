import { onDelete } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onDelete<UserData>((snapshot) => {
	console.log(snapshot.data().name);
});
