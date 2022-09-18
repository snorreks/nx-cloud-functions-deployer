import { onCreate } from 'nx-cloud-functions-deployer';
import type { NotificationData } from '@shared/types';

export default onCreate<NotificationData>((notification) => {
	console.log(`Notification ${notification.id} created`);
});
