import type { PackageManager } from '$types';
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
	const { runScriptFilePath, tsconfigPath } = options;
	const commandArguments: string[] = ['--no-warnings', '--import', 'tsx'];

	if (tsconfigPath) {
		commandArguments.push('--tsconfig', tsconfigPath);
	}
	commandArguments.push(runScriptFilePath);

	await runCommand({
		command: 'node',
		commandArguments,
		silent: false,
		...options,
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

export const runCommand = async (options: {
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
	try {
		// Dynamically import execa
		const execaModule = await import('execa');
		// @ts-expect-error execaModule
		const execa = ((execaModule.default as unknown) ??
			execaModule.execa) as typeof import('execa').execa;

		if (typeof execa !== 'function') {
			throw new Error(
				'execa is not a function. Please check the import.',
			);
		}

		const subprocess = execa(command, commandArguments, {
			cwd,
			env: environment,
			stdio: silent ? 'pipe' : 'inherit',
		});

		if (!silent) {
			subprocess.stdout?.pipe(process.stdout);
			subprocess.stderr?.pipe(process.stderr);
		}

		const { exitCode, stdout, stderr } = await subprocess;

		if (silent) {
			logger.debug(`stdout: ${stdout}`);
			logger.debug(`stderr: ${stderr}`);
		}

		if (exitCode !== 0) {
			throw new Error(
				`Command "${command} ${commandArguments.join(' ')}" failed with exit code ${exitCode}`,
			);
		}
	} catch (error) {
		logger.debug('runCommand:error', error);
		throw error;
	}
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
