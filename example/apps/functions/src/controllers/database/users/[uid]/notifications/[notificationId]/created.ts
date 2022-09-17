import { onCreate } from 'nx-cloud-functions-deployer';
import type { NotificationData } from '@shared/types';

export default onCreate<NotificationData>((snapshot) => {
	console.log(snapshot.data().message);
});
