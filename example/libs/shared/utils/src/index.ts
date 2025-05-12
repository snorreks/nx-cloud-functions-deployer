import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { CoreData } from 'nx-cloud-functions-deployer';

export const helloWorldFromSharedUtils = (): string => {
	return 'Hello World from Shared Utils';
};

export const toCoreData = <T extends CoreData>(
	documentSnap: QueryDocumentSnapshot,
): T =>
	({
		...documentSnap.data(),
		id: documentSnap.id,
	}) as T;
