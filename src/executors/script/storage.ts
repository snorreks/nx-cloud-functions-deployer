import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

type Value = number | string | boolean;

interface Config {
	[key: string]: Value;
}
export interface StorageInterface {
	set<T extends Value>(key: string, value: T): Promise<void>;
	get<T extends Value>(key: string): Promise<T | undefined>;
	unset(key: string): Promise<void>;
}

export interface StorageOptions {
	filePath?: string;
}

class Storage implements StorageInterface {
	private filePath: string;
	private config: Config | undefined;

	constructor(options: StorageOptions) {
		const filePath = join(__dirname, options.filePath || 'preference.json');
		this.filePath = filePath;
	}

	async set<T extends Value = Value>(key: string, value: T): Promise<void> {
		if (!this.config) {
			this.config = await this.read();
		}
		this.config[key] = value;
		await this.write();
	}

	async get<T extends Value = Value>(key: string): Promise<T | undefined> {
		if (!this.config) {
			this.config = await this.read();
		}
		if (key in this.config) {
			return this.config[key] as T;
		} else {
			return undefined;
		}
	}

	async unset(key: string): Promise<void> {
		if (!this.config) {
			this.config = await this.read();
		}
		delete this.config[key];
		await this.write();
	}

	private async read(): Promise<Config> {
		try {
			const data = await readFile(this.filePath);
			return JSON.parse(data.toString());
		} catch (e) {
			if ((e as { code?: string }).code !== 'ENOENT') {
				throw e;
			}
			return {};
		}
	}

	private async write(): Promise<void> {
		await writeFile(
			this.filePath,
			JSON.stringify(this.config ?? {}, null, 2),
		);
	}
}

export const storage = (options: StorageOptions = {}): StorageInterface => {
	return new Storage(options);
};
