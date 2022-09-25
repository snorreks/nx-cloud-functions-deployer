import chalk from 'chalk';
import { readdir } from 'fs/promises';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import open from 'open';
import { join } from 'path';
import type { RunScriptEnvironment } from '$types';
import { toDisplayDuration, toImportPath } from '$utils/common';
import { storage } from './storage';

interface ScriptResponse {
	open?: string;
}
const userPreference = storage();

const handleScript = async (
	options: RunScriptEnvironment & {
		scriptFileName: string;
	},
) => {
	const scriptFileName = options.scriptFileName;
	const firebaseProjectId = options.CFD_FIREBASE_PROJECT_ID;
	const functionsConfigPath = options.CFD_FUNCTIONS_CONFIG_PATH;
	const scriptsRoot = options.CFD_SCRIPTS_ROOT;

	const spinner = createSpinner(
		`Running script ${chalk.bold(scriptFileName)} in ${chalk.bold(
			firebaseProjectId,
		)}...`,
	).start();
	try {
		await import(toImportPath(functionsConfigPath));

		const script = await import(
			toImportPath(join(scriptsRoot, `${scriptFileName}.ts`))
		);
		const start = Date.now();

		const response = (await script.default()) as ScriptResponse;

		const end = Date.now();
		const timeInMs = end - start;

		spinner.success({
			text: chalk.green(
				`Successfully executed ${chalk.bold(
					scriptFileName,
				)} in ${chalk.bold(firebaseProjectId)}! ${chalk.dim(
					toDisplayDuration(timeInMs),
				)}`,
			),
		});

		if (typeof response !== 'undefined') {
			console.log(response);
			if (response.open) {
				await open(response.open, { wait: true });
			}
		}

		process.exit(0);
	} catch (e) {
		spinner.error({
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

const askScriptFileName = async (
	scriptsRoot: string,
	defaultScript = 'test',
): Promise<string> => {
	console.log('scriptsRoot', scriptsRoot);
	const answers = await inquirer.prompt({
		choices: (
			await readdir(scriptsRoot)
		).map((file) => file.replace('.ts', '')),
		default() {
			return defaultScript;
		},
		message: 'Select script',
		name: 'script',
		type: 'rawlist',
	});

	return answers.script;
};

const runScript = async () => {
	const environment = process.env as RunScriptEnvironment;

	const cachedScript = await userPreference.get<string>('script');

	const scriptFileName = await getScriptFileName(environment, cachedScript);

	if (scriptFileName !== cachedScript) {
		await userPreference.set('script', scriptFileName);
	}

	console.clear();

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
