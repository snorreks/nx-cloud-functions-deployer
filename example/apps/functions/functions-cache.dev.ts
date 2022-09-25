import type {
	FunctionsCacheFetch,
	FunctionsCacheUpdate,
	FunctionsCache,
} from 'nx-cloud-functions-deployer';

import axios from 'axios';

const baseURL = 'https://api.jsonbin.io/v3/b';
const binId = '632f4a58a1610e63863762f0';

const jsonbinMasterKey =
	'$2b$10$SZkinpMz0Faiv/pl4/Nt7OdyYsnHj9p/unvhZUmjNQyzWcj6hIT.m';

export const fetch: FunctionsCacheFetch = async () => {
	const response = await axios.get<FunctionsCache>(
		`${baseURL}/${binId}/latest`,
		{
			headers: {
				'X-Master-Key': jsonbinMasterKey,
				'X-Bin-Meta': 'false',
			},
		},
	);
	return response.data;
};

export const update: FunctionsCacheUpdate = async (newFunctionsCache) => {
	const oldFunctionsCache = await fetch();

	const mergedFunctionsCache = {
		...oldFunctionsCache,
		...newFunctionsCache,
	};

	await axios.put(`${baseURL}/${binId}`, mergedFunctionsCache, {
		headers: {
			'X-Master-Key': jsonbinMasterKey,
		},
	});
};
