import type { DocumentSnapshot } from 'firebase-admin/firestore';

export default async (documentSnap: DocumentSnapshot): Promise<void> => {
	console.log('onNotificationCreate', documentSnap);
};
