import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions';

export default async (change: Change<DocumentSnapshot>): Promise<void> => {
	const oldNotification = change.before;
	const newNotification = change.after;
	console.log('onNotificationUpdate', oldNotification, newNotification);
};
