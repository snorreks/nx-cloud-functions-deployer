import { onUpdate } from 'nx-cloud-functions-deployer';
import type { NotificationData } from '@shared/types';

export default onUpdate<NotificationData>((change) => {
	const before = change.before.data();
	const after = change.after.data();
	console.log(before.message, after.message);
});
