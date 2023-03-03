import type { NodeVersion } from './helper-options';

export interface BuildExecutorOptions {
	input: string;
	output: string;
	external?: string[];
	nodeVersion?: NodeVersion;
}
