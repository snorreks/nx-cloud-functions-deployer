import { firestore } from '$configs/firestore';
import type { ScriptFunction } from 'nx-cloud-functions-deployer';

export default (async () => {
	await firestore.collection('users').add({
		name: 'John Doe',
		age: 30,
	});
}) satisfies ScriptFunction;
