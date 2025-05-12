import chalk from 'chalk';
import { readdir } from 'node:fs/promises';
import { input, select } from '@inquirer/prompts';
import { createSpinner } from 'nanospinner';
import open from 'open';
import { resolve } from 'node:path';
import type {
	RunScriptEnvironment,
	ScriptFunction,
	ScriptOpenURLResponse,
} from '$types';
import { toDisplayDuration, toImportPath } from '$utils/common';
import { storage } from './storage';
import { config } from 'dotenv';

const userPreference = storage();

const isOpenURLResponse = (
	response: unknown,
): response is ScriptOpenURLResponse => {
	return (
		typeof response === 'object' &&
		response !== null &&
		'openURL' in response &&
		typeof response.openURL === 'string'
	);
};

const handleScript = async (
	options: RunScriptEnvironment & {
		scriptFileName: string;
	},
) => {
	const verbose = options.CFD_VERBOSE === '1';
	const scriptFileName = options.scriptFileName;
	const firebaseProjectId = options.CFD_FIREBASE_PROJECT_ID;
	const scriptConfigPath = options.CFD_SCRIPT_CONFIG_PATH;
	const scriptsRoot = options.CFD_SCRIPTS_ROOT;
	const envConfigPath = options.CFD_ENV_CONFIG_PATH;
	const runScriptFileDirectory = options.CFD_RUN_SCRIPT_FILE_DIRECTORY;

	if (envConfigPath) {
		try {
			config({ path: envConfigPath });
		} catch (error) {
			console.log('error', error);
		}
	}

	const spinner = !verbose
		? createSpinner(
				`Running script ${chalk.bold(scriptFileName)} in ${chalk.bold(
					firebaseProjectId,
				)}...`,
			).start()
		: undefined;
	try {
		if (scriptConfigPath) {
			try {
				const scriptConfigImportPath = toImportPath(
					scriptConfigPath,
					runScriptFileDirectory,
				);
				if (verbose) {
					console.log(
						'scriptConfigImportPath',
						scriptConfigImportPath,
					);
				}
				await import(scriptConfigImportPath);
			} catch (error) {
				console.log('error', error);
			}
		}

		const scriptImportPath = toImportPath(
			resolve(scriptsRoot, `${scriptFileName}.ts`),
			runScriptFileDirectory,
		);
		if (verbose) {
			console.log('scriptImportPath', scriptImportPath);
		}

		const script = await import(scriptImportPath);
		const start = Date.now();

		const scriptFunction = toScriptFunction(scriptFileName, script);

		const response = await scriptFunction({
			prompt: async (questions) => {
				spinner?.stop();
				const response = await input(questions);
				spinner?.start();
				return response;
			},
		});

		const end = Date.now();
		const timeInMs = end - start;

		if (
			(response as { success?: boolean } | undefined)?.success === false
		) {
			spinner?.error({
				text: chalk.red(
					`Failed to run ${chalk.bold(
						scriptFileName,
					)} in ${chalk.bold(firebaseProjectId)}!`,
				),
			});
			return process.exit(1);
		}

		spinner?.success({
			text: chalk.green(
				`Successfully executed ${chalk.bold(
					scriptFileName,
				)} in ${chalk.bold(firebaseProjectId)}! ${chalk.dim(
					toDisplayDuration(timeInMs),
				)}`,
			),
		});

		if (typeof response !== 'undefined') {
			console.log(
				typeof response === 'object' || Array.isArray(response)
					? JSON.stringify(response, null, 2)
					: response,
			);

			if (isOpenURLResponse(response)) {
				try {
					await open(response.openURL, { wait: true });
				} catch (error) {
					console.error('failed to open link', error);
				}
			}
		}

		process.exit(0);
	} catch (e) {
		spinner?.error({
			text: chalk.red(
				`Failed to run ${chalk.bold(scriptFileName)} in ${chalk.bold(
					firebaseProjectId,
				)}!`,
			),
		});
		console.error(e);
		process.exit(1);
	}
};

const toScriptFunction = (
	scriptFileName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	script: any,
): ScriptFunction => {
	if (typeof script.handler === 'function') {
		return script;
	}

	const defaultScript = script.default;

	if (!defaultScript) {
		throw new Error(
			`Script ${scriptFileName} does not export a default function`,
		);
	}

	if (typeof defaultScript === 'function') {
		return defaultScript;
	}

	if (typeof defaultScript.handler === 'function') {
		return defaultScript.handler;
	}

	if (typeof defaultScript.default === 'function') {
		return defaultScript.default;
	}

	throw new Error(
		`Script ${scriptFileName} does not export a default function`,
	);
};

const askScriptFileName = async (
	scriptsRoot: string,
	defaultScript = 'test',
): Promise<string> => {
	const answer = await select<string>({
		choices: (await readdir(scriptsRoot))
			.filter((file) => file.endsWith('.ts'))
			.map((file) => file.replace('.ts', '')),
		default() {
			return defaultScript;
		},
		message: 'Select script',
	});

	return answer;
};

const runScript = async () => {
	const environment = process.env as RunScriptEnvironment;
	const verbose = environment.CFD_VERBOSE === '1';
	const cachedScript = await userPreference.get<string>('script');

	const scriptFileName = await getScriptFileName(environment, cachedScript);

	if (scriptFileName !== cachedScript) {
		await userPreference.set('script', scriptFileName);
	}
	if (!verbose) {
		console.clear();
	}

	return handleScript({
		...environment,
		scriptFileName,
	});
};

const getScriptFileName = async (
	environment: RunScriptEnvironment,
	cachedScript?: string,
): Promise<string> => {
	let scriptFileName = environment.CFD_SCRIPT_FILE_NAME;
	if (scriptFileName) {
		await userPreference.set('script', scriptFileName);
		return scriptFileName.replace('.ts', '');
	}

	const runPrevious = environment.CFD_RUN_PREVIOUS === '1';
	if (runPrevious && cachedScript) {
		return cachedScript;
	}
	const scriptsRoot = environment.CFD_SCRIPTS_ROOT;

	scriptFileName = await askScriptFileName(scriptsRoot, cachedScript);

	return scriptFileName;
};

runScript();
