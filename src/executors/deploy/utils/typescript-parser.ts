import type {
	FunctionType,
	DeployableFileLiteData,
	RootFunctionBuilder,
	BaseDeployOptions,
} from '$types';
import { functionTypes } from '$constants';
import {
	createProgram,
	forEachChild,
	isCallExpression,
	isExportAssignment,
	isMemberName,
	ScriptTarget,
} from 'typescript';
import { toRelativeDeployFilePath } from '$utils';

/** Validates all files and returns `DeployableFileLiteData[]` */
export const validateDeployFiles = (
	filePaths: string[],
	baseOptions: BaseDeployOptions,
): DeployableFileLiteData[] => {
	// Build a program using the set of root file names in fileNames
	const program = createProgram(filePaths, {
		target: ScriptTarget.Latest,
	});
	const sourceFiles = program.getSourceFiles();

	const deployableFiles: DeployableFileLiteData[] = [];
	// Visit every sourceFile in the program
	for (const sourceFile of sourceFiles) {
		if (!sourceFile.isDeclarationFile) {
			// Walk the tree to search for export functionTypes
			forEachChild(sourceFile, (node) => {
				if (
					isExportAssignment(node) &&
					isCallExpression(node.expression) &&
					isMemberName(node.expression.expression)
				) {
					const escapedText = node.expression.expression.escapedText;

					if (functionTypes.includes(escapedText as FunctionType)) {
						const functionType = escapedText as FunctionType;
						const absolutePath = sourceFile.fileName;
						// TODO get arguments from node.expression.arguments

						deployableFiles.push({
							...baseOptions,
							functionType,
							absolutePath,
							rootFunctionBuilder:
								toRootFunctionType(functionType),
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

const toRootFunctionType = (
	functionType: FunctionType,
): RootFunctionBuilder => {
	switch (functionType) {
		case 'onCreate':
		case 'onUpdate':
		case 'onDelete':
		case 'onWrite':
			return 'firestore';
		case 'onRealtimeDatabaseCreate':
		case 'onRealtimeDatabaseUpdate':
		case 'onRealtimeDatabaseDelete':
		case 'onRealtimeDatabaseWrite':
			return 'database';
		case 'onCall':
		case 'onRequest':
			return 'https';
		case 'schedule':
		case 'topic':
			return 'pubsub';
		case 'onObjectArchive':
		case 'onObjectDelete':
		case 'onObjectFinalize':
		case 'onObjectMetadataUpdate':
			return 'storage';
		default:
			throw new Error('Invalid function type');
	}
};
