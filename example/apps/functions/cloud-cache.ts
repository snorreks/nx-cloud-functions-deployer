import type {
	CloudCacheFetch,
	CloudCacheUpdate,
	CloudCache,
} from 'nx-cloud-functions-deployer';

import axios from 'axios';

const baseURL = 'https://api.jsonbin.io/v3/b';
const binId = '632f4a58a1610e63863762f0';

const jsonbinMasterKey =
	'$2b$10$SZkinpMz0Faiv/pl4/Nt7OdyYsnHj9p/unvhZUmjNQyzWcj6hIT.m';

export const fetch: CloudCacheFetch = async () => {
	const response = await axios.get<CloudCache>(`${baseURL}/${binId}/latest`, {
		headers: {
			'X-Master-Key': jsonbinMasterKey,
			'X-Bin-Meta': 'false',
		},
	});
	return response.data;
};

export const update: CloudCacheUpdate = async (newCloudCache) => {
	const oldCloudCache = await fetch();

	const mergedCloudCache = {
		...oldCloudCache,
		...newCloudCache,
	};

	await axios.put(`${baseURL}/${binId}`, mergedCloudCache, {
		headers: {
			'X-Master-Key': jsonbinMasterKey,
			'X-Bin-Meta': 'false',
		},
	});
};
