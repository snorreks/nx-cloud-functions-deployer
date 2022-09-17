import { onCreate } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onCreate<UserData>((snapshot) => {
	console.log(snapshot.data().name);
});
