import { unlinkSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
	FunctionType,
	RelativeDeployFilePath,
	RootFunctionBuilder,
} from '../types';

export const createTemporaryIndexFunctionFile = async ({
	deployableFilePath,
	functionName,
	functionType,
	region,
	relativePathToDeployFile,
	temporaryDirectory,
}: {
	temporaryDirectory: string;
	region: string;
	deployableFilePath: string;
	relativePathToDeployFile: RelativeDeployFilePath;
	functionName: string;
	functionType: FunctionType;
}): Promise<string> => {
	const code = toDeployIndexCode({
		deployableFilePath,
		functionName,
		functionType,
		region,
		relativePathToDeployFile,
	});
	const temporaryFilePath = getTemporaryFilePath(
		temporaryDirectory,
		functionName,
	);

	await createTemporaryFile(temporaryFilePath, code);
	return temporaryFilePath;
};

const getTemporaryFilePath = (
	temporaryDirectory: string,
	functionName: string,
) => join(temporaryDirectory, `${functionName}.ts`);

const toRootFunctionBuilder = (
	functionType: FunctionType,
): RootFunctionBuilder => {
	switch (functionType) {
		case 'onCall':
		case 'onRequest':
			return 'https';
		case 'onCreate':
		case 'onUpdate':
		case 'onDelete':
			return 'firestore';
		case 'schedule':
			return 'pubsub';
	}
};

const getDocumentPath = (
	relativeFilePath: RelativeDeployFilePath,
): string | undefined => {
	if (!relativeFilePath.startsWith('database')) {
		return undefined;
	}

	const paths = relativeFilePath.split('\\');
	paths.pop(); // Remove updated.ts | created.ts | deleted.ts
	paths.shift(); // Remove database
	return paths.join('/').replaceAll('[', '{').replaceAll(']', '}');
};

const toDeployIndexCode = ({
	deployableFilePath,
	functionName,
	functionType,
	region,
	relativePathToDeployFile,
}: {
	functionType: FunctionType;
	functionName: string;
	relativePathToDeployFile: RelativeDeployFilePath;
	deployableFilePath: string;
	region: string;
}) => {
	const rootFunctionBuilder = toRootFunctionBuilder(functionType);
	deployableFilePath = deployableFilePath.replaceAll('\\', '/');

	const importCodeStartSection = `(await import('${deployableFilePath}')).default`;
	const documentPath = getDocumentPath(relativePathToDeployFile);

	const toEndCode = (): string => {
		if (
			['onCreate', 'onUpdate', 'onDelete'].includes(functionType) &&
			!documentPath
		) {
			throw new Error(
				'Document path is required for firestore functions',
			);
		}

		switch (functionType) {
			case 'onCall':
			case 'onRequest':
				return `${functionType}(async (data, context) =>
				${importCodeStartSection}(data,context));`;
			case 'onCreate':
			case 'onDelete':
				return `document('${documentPath}').${functionType}(async (snap) =>
				${importCodeStartSection}(snap));`;
			case 'onUpdate':
				return `document('${documentPath}').${functionType}(async (change) =>
				${importCodeStartSection}(change));`;
			case 'schedule':
				throw new Error('schedule not implemented yet');
			default:
				throw new Error(`Unknown function type: ${functionType}`);
		}
	};

	const fileCode = `import { region } from 'firebase-functions';
    const rootFunctionBuilder = region('${region}').${rootFunctionBuilder};
    export const ${functionName} = rootFunctionBuilder.${toEndCode()}`;
	return fileCode;
};

const createTemporaryFile = async (
	filePath: string,
	code: string,
): Promise<void> => {
	process.on('exit', () => {
		try {
			unlinkSync(filePath);
		} catch (error) {
			console.log(error);
		}
	});

	await writeFile(filePath, code);
};
