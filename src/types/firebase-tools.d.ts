declare module 'firebase-tools' {
	const client: {
		functions: {
			list: (options: { project: string }) => Promise<{ id: string }[]>;
		};
	};
	export default client;
}
