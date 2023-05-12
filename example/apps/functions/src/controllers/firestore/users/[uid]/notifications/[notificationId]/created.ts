import { onCreated } from 'nx-cloud-functions-deployer';
import type { NotificationData } from '@shared/types';

export default onCreated<NotificationData>(({ data }) => {
	console.log(`Notification ${data.id} created`);
});
