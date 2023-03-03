import { firestore } from '$configs/firestore';
import type { ScriptFunction } from 'nx-cloud-functions-deployer';

export default (async ({ prompt }) => {
	console.log('prompt', prompt);
	const { uid } = await prompt<{ uid: string }>({
		type: 'input',
		name: 'uid',
		message: 'Enter the uid',
		validate: (value) => {
			if (value.length === 20) {
				return true;
			}

			return 'The uid must be 20 characters long';
		},
	});

	const documentSnap = await firestore.collection('users').doc(uid).get();

	if (!documentSnap.exists) {
		throw new Error('User not found');
	}
	return { id: documentSnap.id, ...documentSnap.data() };
}) satisfies ScriptFunction;
