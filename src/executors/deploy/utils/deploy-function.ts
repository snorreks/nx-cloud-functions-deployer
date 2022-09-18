import type { DeployableFileData } from '$types';
import execa from 'execa';

export const deployFunction = async ({
	firebaseProjectId,
	functionName,
	outputRoot,
	packageManager,
}: DeployableFileData) => {
	if (packageManager === 'global') {
		await execa(
			'firebase',
			[
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
	} else if (packageManager === 'npm') {
		await execa(
			'npm',
			[
				'run',
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
	} else {
		await execa(
			packageManager,
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
	}
};
