import type {
	FunctionsCacheFetch,
	FunctionsCacheUpdate,
	FunctionsCache,
} from 'nx-cloud-functions-deployer';

import axios from 'axios';

const baseURL = 'https://api.jsonbin.io/v3/b';

const getBinId = (flavor: string): string => {
	switch (flavor) {
		case 'production':
			return '632f4a58a1610e63863362f0';
		case 'development':
			return '632f4a58a1610e63863762f0';
		default:
			throw new Error(`Unknown flavor: ${flavor}`);
	}
};

const jsonbinMasterKey =
	'$2b$10$SZkinpMz0Faiv/pl4/Nt7OdyYsnHj9p/unvhZUmjNQyzWcj6hIT.m';

export const fetch: FunctionsCacheFetch = async ({ flavor }) => {
	const binId = getBinId(flavor);
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

export const update: FunctionsCacheUpdate = async ({
	flavor,
	newFunctionsCache,
}) => {
	const oldFunctionsCache = await fetch({ flavor });

	const mergedFunctionsCache = {
		...oldFunctionsCache,
		...newFunctionsCache,
	};

	const binId = getBinId(flavor);

	await axios.put(`${baseURL}/${binId}`, mergedFunctionsCache, {
		headers: {
			'X-Master-Key': jsonbinMasterKey,
		},
	});
};
