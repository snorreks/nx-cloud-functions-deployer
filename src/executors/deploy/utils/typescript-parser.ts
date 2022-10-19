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
		case 'onCreate':
		case 'onUpdate':
		case 'onDelete':
		case 'onWrite':
			return 'firestore';
		case 'onRefCreate':
		case 'onRefUpdate':
		case 'onRefDelete':
		case 'onRefWrite':
			return 'database';
		case 'onCall':
		case 'onRequest':
		case 'onCallV2':
		case 'onRequestV2':
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
