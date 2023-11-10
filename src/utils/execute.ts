import type { PackageManager } from '$types';
import { spawn } from 'cross-spawn';
import { logger } from './logger';
type Environment = Record<string, string | undefined>;

export const execute = async (options: {
	packageManager: PackageManager;
	commandArguments: string[];
	cwd?: string;
	environment?: Environment;
	silent?: boolean;
}) => {
	const { packageManager, commandArguments } = options;
	if (packageManager === 'global') {
		await runCommand({
			...options,
			command: commandArguments[0],
			commandArguments: commandArguments.slice(1),
		});
	} else if (packageManager === 'npm') {
		await runCommand({
			...options,
			command: 'npm',
			commandArguments: ['run', ...commandArguments],
		});
	} else {
		await runCommand({
			...options,
			command: packageManager,
			commandArguments,
		});
	}
};

export const runFile = async (options: {
	runScriptFilePath: string;
	cwd: string;
	tsconfigPath?: string;
	environment?: Environment;
}) => {
	logger.debug('runFile', options);
	const { runScriptFilePath, cwd, tsconfigPath, environment } = options;
	const commandArguments: string[] = ['--no-warnings', '--import', 'tsx'];

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

export const runCommand = (options: {
	command: string;
	cwd?: string;
	commandArguments?: string[];
	environment?: Environment;
	silent?: boolean;
}): Promise<void> => {
	logger.debug('runCommand', options);
	const {
		command,
		cwd,
		commandArguments = [],
		environment,
		silent,
	} = options;
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
		child.on('error', (error) => {
			logger.error(error);
			reject(error);
		});
		child.on('exit', (code) => {
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
		child.on('disconnect', () => {
			reject(
				new Error(
					`Command "${command} ${commandArguments.join(
						' ',
					)}" disconnected`,
				),
			);
		});
	});
};
/*

export const runCommand = async ({
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
	logger.debug(`Executing "${command} ${commandArguments.join(' ')}"...`);
	const { childProcess } = await nvexeca('16', command, commandArguments, {
		cwd,
		env: environment ?? process.env,
		stdio: silent ? undefined : 'inherit',
	});
	const response = await childProcess;
	if (!response) {
		throw new Error('No response from child process');
	}
	const { exitCode, failed, isCanceled, escapedCommand, stdout, stderr } =
		response;

	if (failed) {
		logger.debug(`stdout: ${stdout}`);
		logger.debug(`stderr: ${stderr}`);
		throw new Error(
			`Command "${escapedCommand}" failed with exit code ${exitCode}`,
		);
	}
	if (isCanceled) {
		logger.debug(`stdout: ${stdout}`);
		logger.debug(`stderr: ${stderr}`);
		throw new Error(
			`Command "${escapedCommand}" was canceled with exit code ${exitCode}`,
		);
	}
};


*/
