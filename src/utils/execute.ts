import { spawn } from 'cross-spawn';
import type { PackageManager } from '$types';
import { logger } from './logger';

type Environment = Record<string, string | undefined>;

export const execute = async ({
	packageManager,
	commandArguments,
	cwd,
	environment,
}: {
	packageManager: PackageManager;
	commandArguments: string[];
	cwd: string;
	environment?: Environment;
}) => {
	if (packageManager === 'global') {
		await runCommand({
			command: commandArguments[0],
			commandArguments: commandArguments.slice(1),
			cwd,
			environment,
		});
	} else if (packageManager === 'npm') {
		await runCommand({
			command: 'npm',
			commandArguments: ['run', ...commandArguments],
			cwd,
			environment,
		});
	} else {
		await runCommand({
			command: packageManager,
			commandArguments,
			cwd,
			environment,
		});
	}
};

export const runFile = async ({
	packageManager,
	runScriptFilePath,
	cwd,
	tsconfigPath,
	environment,
}: {
	packageManager: PackageManager;
	runScriptFilePath: string;
	cwd: string;
	tsconfigPath?: string;
	environment?: Environment;
}) => {
	const commandArguments: string[] = ['tsx'];

	if (tsconfigPath) {
		commandArguments.push('--tsconfig', tsconfigPath);
	}
	commandArguments.push(runScriptFilePath);

	await execute({
		packageManager,
		commandArguments,
		cwd,
		environment,
	});
};

export const nodeRunFile = async ({
	runScriptFilePath,
	cwd,
	tsconfigPath,
	environment,
}: {
	runScriptFilePath: string;
	cwd: string;
	tsconfigPath?: string;
	environment?: Environment;
}) => {
	const commandArguments: string[] = ['--no-warnings', '--loader', 'tsx'];

	if (tsconfigPath) {
		commandArguments.push('--tsconfig', tsconfigPath);
	}
	commandArguments.push(runScriptFilePath);

	await runCommand({
		command: 'node',
		commandArguments,
		cwd,
		environment,
		silent: false,
	});
};

/**
 * Run a command in a shell.
 *
 * @param command the command to execute
 * @param args the arguments to pass to the command
 * @param cwd the path in the monorepo to execute the command
 * @param env the environments ot pass to the command
 * @returns the result of the command
 */
const runCommand = ({
	command,
	commandArguments = [],
	cwd,
	silent = !logger.verbose,
	environment = process.env,
}: {
	command: string;
	cwd?: string;
	commandArguments?: string[];
	environment?: Environment;
	silent?: boolean;
}): Promise<void> => {
	return new Promise((resolve, reject) => {
		logger.debug(`Executing "${command} ${commandArguments.join(' ')}"...`);
		const child = spawn(command, commandArguments, {
			cwd,
			env: environment ?? process.env,
			stdio: silent ? undefined : 'inherit',
		});
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`Command "${command} ${commandArguments.join(
							' ',
						)}" failed with exit code ${code}`,
					),
				);
			}
		});
	});
};
