import { onDelete } from 'nx-cloud-functions-deployer';
import type { NotificationData } from '@shared/types';

export default onDelete<NotificationData>((snapshot) => {
	console.log(snapshot.data().message);
});
