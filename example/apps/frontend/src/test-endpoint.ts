import { callAPI } from '.';

const callTestAPI = async () => {
	const result = await callAPI('test_api', { message: 'test' });
	console.log(result.flavor);
	console.log(result.dataFromSharedLib);
};
callTestAPI();
