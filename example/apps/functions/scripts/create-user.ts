import { firestore } from '$configs/firestore';

export default async () => {
	console.log('flavor', process.env.FLAVOR);
	await firestore.collection('users').add({
		name: 'John Doe',
		age: 30,
	});

	return {
		success: true,
	};
};
