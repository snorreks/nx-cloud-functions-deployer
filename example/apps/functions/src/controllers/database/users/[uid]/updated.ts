import { onUpdate } from 'nx-cloud-functions-deployer';
import type { UserData } from '@shared/types';

export default onUpdate<UserData>((change) => {
	const before = change.before.data();
	const after = change.after.data();
	console.log(before.name, after.name);
});
