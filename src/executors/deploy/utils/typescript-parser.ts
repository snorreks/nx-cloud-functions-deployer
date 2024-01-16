import type {
	DeployFunction,
	BuildFunctionLiteData,
	FunctionBuilder,
	BaseDeployOptions,
} from '$types';
import {
	createProgram,
	forEachChild,
	isCallExpression,
	isExportAssignment,
	isMemberName,
	ScriptTarget,
} from 'typescript';
import { isDeployFunction, toRelativeDeployFilePath } from '$utils';

/** Validates all files and returns `BuildFunctionLiteData[]` */
export const validateDeployFiles = (
	filePaths: string[],
	baseOptions: BaseDeployOptions,
): BuildFunctionLiteData[] => {
	// Build a program using the set of root file names in fileNames
	const program = createProgram(filePaths, {
		target: ScriptTarget.Latest,
	});
	const sourceFiles = program.getSourceFiles();

	const deployableFiles: BuildFunctionLiteData[] = [];
	// Visit every sourceFile in the program
	for (const sourceFile of sourceFiles) {
		if (!sourceFile.isDeclarationFile) {
			// Walk the tree to search for export functions
			forEachChild(sourceFile, (node) => {
				if (
					isExportAssignment(node) &&
					isCallExpression(node.expression) &&
					isMemberName(node.expression.expression)
				) {
					const escapedText = node.expression.expression.escapedText;

					if (isDeployFunction(escapedText)) {
						const deployFunction = escapedText;
						const absolutePath = sourceFile.fileName;
						// TODO get arguments from node.expression.arguments

						deployableFiles.push({
							...baseOptions,
							environment: {
								...baseOptions.environment,
							},
							deployFunction,
							absolutePath,
							rootFunctionBuilder: toRootFunction(deployFunction),
							relativeDeployFilePath: toRelativeDeployFilePath(
								absolutePath,
								baseOptions.functionsDirectory,
							),
						});
						return;
					}
				}
			});
		}
	}

	return deployableFiles;
};

const toRootFunction = (deployFunction: DeployFunction): FunctionBuilder => {
	switch (deployFunction) {
		case 'onCreated':
		case 'onUpdated':
		case 'onDeleted':
		case 'onWritten':
		case 'onDocumentCreated':
		case 'onDocumentUpdated':
		case 'onDocumentDeleted':
		case 'onDocumentWritten':
			return 'firestore';
		case 'onValueCreated':
		case 'onValueUpdated':
		case 'onValueDeleted':
		case 'onValueWritten':
			return 'database';
		case 'onCall':
		case 'onRequest':
			return 'https';
		case 'onSchedule':
			return 'scheduler';
		case 'onObjectArchived':
		case 'onObjectDeleted':
		case 'onObjectFinalized':
		case 'onObjectMetadataUpdated':
			return 'storage';
		case 'onAuthDelete':
		case 'onAuthCreate':
		case 'beforeAuthCreate':
		case 'beforeAuthSignIn':
			return 'auth';

		default:
			throw new Error('Invalid function type');
	}
};
