import { cert, initializeApp } from 'firebase-admin/app';

const getApp = () => {
	const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
	if (!serviceAccountString) {
		// this is running in the cloud and don't need credentials
		return initializeApp();
	}

	const serviceAccount = JSON.parse(serviceAccountString);
	return initializeApp({
		credential: cert(serviceAccount),
		databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
	});
};

export default getApp();
