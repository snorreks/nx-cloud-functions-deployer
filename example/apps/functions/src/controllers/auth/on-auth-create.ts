import { onAuthCreate } from 'nx-cloud-functions-deployer';

export default onAuthCreate(({ uid }) => {
	console.log('New user created: uid', uid);
});
