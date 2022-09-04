import { getFirestore } from 'firebase-admin/firestore';
import app from './app';
import { isDevelopmentFlavor as isDevelopmentProject } from './environment';

const database = getFirestore(app);

database.settings({
	ignoreUndefinedProperties: !isDevelopmentProject,
});

export { database };
