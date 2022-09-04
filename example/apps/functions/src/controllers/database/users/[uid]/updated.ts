import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions';

export default async (change: Change<DocumentSnapshot>): Promise<void> => {
	const oldUser = change.before;
	const newUser = change.after;
	console.log('onUserUpdate', oldUser, newUser);
};
