import { firestore } from '$configs/firestore';
import { toCoreData } from '@shared/utils';
import type { UserData } from '@shared/types';

export default async () => {
	const users = await firestore.collection('users').get();

	return users.docs.map((document) => toCoreData<UserData>(document));
};
