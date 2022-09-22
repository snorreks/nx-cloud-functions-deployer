import type { PackageManager } from '$types';
import execa from 'execa';

export const execute = async ({
	packageManager,
	options,
	cwd,
}: {
	packageManager: PackageManager;
	options: string[];
	cwd: string;
}) => {
	if (packageManager === 'global') {
		await execa(options[0], options.slice(1), {
			cwd,
		});
	} else if (packageManager === 'npm') {
		await execa('npm', ['run', ...options], {
			cwd,
		});
	} else {
		await execa(packageManager, options, {
			cwd,
		});
	}
};
