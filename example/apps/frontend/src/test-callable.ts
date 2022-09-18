import { callCloudFunction } from '.';

const callTest = async () => {
	const result = await callCloudFunction('test_callable', {
		message: 'test',
	});
	console.log(result.flavor);
	console.log(result.dataFromSharedLib);
};
callTest();
