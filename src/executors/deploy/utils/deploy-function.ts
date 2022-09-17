import execa from 'execa';

export const deployFunction = async ({
	firebaseProjectId,
	functionName,
	outputRoot,
}: {
	firebaseProjectId: string;
	outputRoot: string;
	functionName: string;
}) => {
	await execa(
		'pnpm',
		[
			'firebase',
			'deploy',
			'--only',
			`functions:${functionName}`,
			'--project',
			firebaseProjectId,
		],
		{
			cwd: outputRoot,
		},
	);
};
