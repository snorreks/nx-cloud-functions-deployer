import chalk from 'chalk';
import { createSpinner, type Spinner } from 'nanospinner';
import { toDisplayDuration } from './common';

/** `LogType` indicates the type of console log. See {@link Console} */
export type LogType = 'debug' | 'info' | 'warn' | 'error' | 'log';

/**
 * The priority of the log entry. The higher the number, the higher the
 * priority.
 */
enum LogSeverityPriority {
	silent = 0,
	debug = 1,
	info = 2,
	warn = 4,
	error = 5,
}

/**
 * `LogSeverity` indicates the detailed severity of the log entry. See
 * {@link LogSeverityPriority} for priority.
 */
export type LogSeverity = keyof typeof LogSeverityPriority;

/**
 * `LogEntry` represents a structured entry. All keys aside from `severity`,
 * `logType` and `message` are included in the log.
 */
export interface LogEntry {
	severity?: LogSeverity;
	logType?: LogType;
	message?: string;
}

/**
 * `Logger` is a wrapper around the console object. It provides a structured
 * logging interface and a way to dynamically set the {@link LogSeverity} (log
 * level).
 *
 * In production, the log severity is set to `CRITICAL` by default.
 *
 * In development, the log severity is set to `info` by default.
 */
export interface LoggerInterface {
	/** The current log severity */
	readonly currentLogSeverity: LogSeverity;

	readonly isDryRun?: boolean;

	/**
	 * Sets the current log severity. If the severity is not set, it will never
	 * log anything.
	 *
	 * In production, the default severity is undefined.
	 *
	 * @param severity The severity to set.
	 */
	setLogSeverity(severity: LogSeverity): void;

	startSpinner(
		deployableFunctionsAmount: number,
		projectId: string,
		isDryRun?: boolean,
	): void;

	endSpinner(): void;

	spinnerLog(text: string): void;

	logFunctionDeployed(functionName: string, time: number): void;

	logFunctionSkipped(functionName: string): void;

	logFunctionFailed(functionName: string, errorMessage?: string): void;

	/**
	 * Writes a `LogEntry` to the console.
	 *
	 * If the severity is not set, it will never log anything. If the severity
	 * is set, it will only log if the severity is greater than or equal to the
	 * current severity. See {@link LogSeverityPriority} for the priority order.
	 *
	 * The default {@link LogSeverity} is `info`.
	 *
	 * The default {@link LogType} is `log`.
	 *
	 * @param entry - The `LogEntry` including severity, message, and any
	 *   additional structured metadata.
	 */
	write(entry: LogEntry, ...data: unknown[]): void;
	/**
	 * Writes a `debug` {@link LogType}.
	 *
	 * The default {@link LogSeverity} is `debug`.
	 *
	 * @param args - Arguments, concatenated into the log message.
	 */
	debug(...args: unknown[]): void;
	/**
	 * Writes a `log` {@link LogType}.
	 *
	 * The default {@link LogSeverity} is `info`.
	 *
	 * @param args - Arguments, concatenated into the log message.
	 */
	log(...args: unknown[]): void;
	/**
	 * Writes a `info` {@link LogType}.
	 *
	 * The default {@link LogSeverity} is `info`.
	 *
	 * @param args - Arguments, concatenated into the log message.
	 */
	info(...args: unknown[]): void;
	/**
	 * Writes a `warn` {@link LogType}.
	 *
	 * The default {@link LogSeverity} is `warn`.
	 *
	 * @param args - Arguments, concatenated into the log message.
	 */
	warn(...args: unknown[]): void;
	/**
	 * Writes a `error` {@link LogType}.
	 *
	 * The default {@link LogSeverity} is `error`.
	 *
	 * @param args - Arguments, concatenated into the log message.
	 * @public
	 */
	error(...args: unknown[]): void;
}

class LoggerService implements LoggerInterface {
	currentLogSeverity: LogSeverity = 'info';

	isDryRun?: boolean;

	private _spinner?: Spinner;
	private _projectId?: string;
	private _deployableFunctionsAmount = 0;

	private readonly _successfullyDeployedFunctions: {
		functionName: string;
		time: number;
	}[] = [];
	private readonly _failedDeployedFunctions: {
		functionName: string;
		errorMessage?: string;
	}[] = [];

	logFunctionSkipped(functionName: string): void {
		this._deployableFunctionsAmount--;
		this.spinnerLog(
			chalk.green(
				`No changes detected for ${chalk.bold(functionName)}, skipping`,
			),
		);
	}

	logFunctionDeployed(functionName: string, time: number): void {
		this._successfullyDeployedFunctions.push({
			functionName,
			time,
		});
		this.spinnerLog(
			chalk.green(
				`Successfully deployed function ${chalk.bold(functionName)}`,
			),
		);
	}

	logFunctionFailed(functionName: string, errorMessage?: string): void {
		this._failedDeployedFunctions.push({
			functionName,
			errorMessage,
		});
		this.spinnerLog(
			chalk.red(
				`Function: ${chalk.bold(functionName)} failed to deploy${
					errorMessage ? `: ${errorMessage}` : ''
				}`,
			),
		);
	}

	private get _successfullyDeployedFunctionAmount(): number {
		return this._successfullyDeployedFunctions.length;
	}
	private get _failedDeployedFunctionAmount(): number {
		return this._failedDeployedFunctions.length;
	}

	get remainingFunctionsAmount(): number {
		return (
			this._deployableFunctionsAmount -
			this._successfullyDeployedFunctionAmount -
			this._failedDeployedFunctionAmount
		);
	}

	setLogSeverity(severity: LogSeverity): void {
		this.currentLogSeverity = severity;
	}

	write(entry: LogEntry, ...data: unknown[]): void {
		if (!this.currentLogSeverity) {
			return;
		}
		const { logType, message, severity } = entry;

		const currentLogSeverityPriority = this.toLogSeverityPriority(
			this.currentLogSeverity,
		);
		const entryLogSeverityPriority = this.toLogSeverityPriority(
			severity || 'info',
		);

		if (currentLogSeverityPriority > entryLogSeverityPriority) {
			return;
		}
		delete entry.severity;
		delete entry.logType;
		delete entry.message;

		const log = console[logType || 'log'];
		if (typeof message !== 'undefined') {
			log(message, ...data);
		} else {
			log(...data);
		}
	}

	get spinnerDefaultText(): string {
		return `${this.isDryRun ? 'Building' : 'Deploying'} for ${
			this._projectId
		}: ${chalk.bold(this.remainingFunctionsAmount)} functions left`;
	}

	startSpinner(
		deployableFunctionsAmount: number,
		projectId: string,
		isDryRun?: boolean,
	): void {
		this._deployableFunctionsAmount = deployableFunctionsAmount;
		this.isDryRun = isDryRun;
		this._projectId = projectId;
		this._spinner = createSpinner(this.spinnerDefaultText).start();
	}

	endSpinner(): void {
		if (
			!this._successfullyDeployedFunctionAmount &&
			!this._failedDeployedFunctionAmount
		) {
			this.spinnerSuccess(
				chalk.green(
					this.isDryRun
						? 'Dry run successful'
						: 'No changes detected, skipping deploy',
				),
			);
			return;
		}

		if (this._successfullyDeployedFunctionAmount) {
			this.spinnerSuccess(
				chalk.green(
					`Successfully ${
						this.isDryRun ? 'build' : 'deployed'
					} ${chalk.bold(
						this._deployableFunctionsAmount,
					)} functions to ${this._projectId}:`,
				),
			);
			for (const { functionName, time } of this
				._successfullyDeployedFunctions) {
				this.info(
					chalk.green(chalk.bold(functionName)),
					`Time: ${toDisplayDuration(time)}`,
				);
			}
		}

		if (this._failedDeployedFunctionAmount) {
			this.spinnerError(
				chalk.red(
					`Failed to ${
						this.isDryRun ? 'build' : 'deploy'
					} ${chalk.bold(
						this._failedDeployedFunctionAmount,
					)} functions to ${this._projectId}:`,
				),
			);

			for (const { functionName, errorMessage } of this
				._failedDeployedFunctions) {
				this.error(
					chalk.red(chalk.bold(functionName)),
					`Error: ${chalk.red(errorMessage)}`,
				);
			}
		}
	}

	spinnerLog(stopText: string): void {
		this._spinner?.stop({
			text: stopText,
		});

		this._spinner?.start({
			text: this.spinnerDefaultText,
		});
	}

	private spinnerSuccess(text: string): void {
		this._spinner?.success({
			text,
		});
	}

	private spinnerError(text: string): void {
		this._spinner?.error({
			text,
		});
	}

	debug(...args: unknown[]): void {
		this.write(
			{
				logType: 'debug',
				severity: 'debug',
			},
			...args,
		);
	}
	info(...args: unknown[]): void {
		this.write(
			{
				logType: 'info',
				severity: 'info',
			},
			...args,
		);
	}
	warn(...args: unknown[]): void {
		this.write(
			{
				logType: 'warn',
				severity: 'warn',
			},
			...args,
		);
	}
	error(...args: unknown[]): void {
		this.write(
			{
				logType: 'error',
				severity: 'error',
			},
			...args,
		);
	}

	log(...args: unknown[]): void {
		this.write(
			{
				logType: 'log',
				severity: 'info',
			},
			...args,
		);
	}

	private toLogSeverityPriority(severity: LogSeverity): LogSeverityPriority {
		return LogSeverityPriority[severity];
	}
}

class LoggerFactory {
	private static logger: LoggerInterface = new LoggerService();
	static getLogger(): LoggerInterface {
		return LoggerFactory.logger;
	}
}

export const logger = LoggerFactory.getLogger();
