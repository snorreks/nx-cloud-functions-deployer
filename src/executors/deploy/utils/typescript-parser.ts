import type {
	FunctionType,
	DeployOption,
	DeployableFileLiteData,
	RootFunctionBuilder,
} from '$types';
import { functionTypes } from '../../../constants';
import ts, {
	createProgram,
	forEachChild,
	isCallExpression,
	isExportAssignment,
	isMemberName,
	ScriptTarget,
} from 'typescript';

/** Read the source code and find the export default `helperFunction` */
export const getDeployableFiles = (
	filePaths: string[],
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
			// Walk the tree to search for classes
			forEachChild(sourceFile, (node) => {
				if (
					isExportAssignment(node) &&
					isCallExpression(node.expression) &&
					isMemberName(node.expression.expression)
				) {
					const escapedText = node.expression.expression.escapedText;

					if (functionTypes.includes(escapedText as FunctionType)) {
						const functionType = escapedText as FunctionType;
						deployableFiles.push({
							functionType,
							absolutePath: sourceFile.fileName,
							deployOptions: getDeployOptionsFromArguments(
								node.expression.arguments,
							),
							rootFunctionBuilder:
								toRootFunctionType(functionType),
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
			return 'firestore';
		case 'onCall':
		case 'onRequest':
			return 'https';
		case 'schedule':
			return 'pubsub';
		default:
			throw new Error('Invalid function type');
	}
};

const getDeployOptionsFromArguments = (
	args: ts.NodeArray<ts.Expression>,
): DeployOption | undefined => {
	// TODO implement this
	return args ? undefined : undefined;
};

/*
Example of node with export default onRequest(...)
{
  pos: 6850,
  end: 8084,
  flags: 0,
  modifierFlagsCache: 0,
  transformFlags: 17793,
  parent: undefined,
  kind: 271,
  symbol: undefined,
  localSymbol: undefined,
  locals: undefined,
  nextContainer: undefined,
  modifiers: undefined,
  isExportEquals: undefined,
  expression: NodeObject {
    pos: 6868,
    end: 8083,
    flags: 32768,
    modifierFlagsCache: 0,
    transformFlags: 17793,
    parent: undefined,
    kind: 208,
    expression: IdentifierObject {
      pos: 6868,
      end: 6878,
      flags: 32768,
      modifierFlagsCache: 0,
      transformFlags: 0,
      parent: undefined,
      kind: 79,
      originalKeywordKind: undefined,
      escapedText: 'onRequest'
    },
    typeArguments: undefined,
    arguments: [
      [NodeObject],
      pos: 6879,
      end: 8082,
      hasTrailingComma: false,
      transformFlags: 17793
    ]
  },
  illegalDecorators: undefined
}
*/
