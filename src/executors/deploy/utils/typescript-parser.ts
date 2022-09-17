import type { FunctionType } from '$types';
import { functionTypes } from 'src/constants';
import {
	createProgram,
	Declaration,
	forEachChild,
	getCombinedModifierFlags,
	isVariableStatement,
	ModifierFlags,
	Node,
	ScriptTarget,
} from 'typescript';

/** Read the source code and find the export default `helperFunction` */
export const getFunctionTypeFromSourceCode = (
	inputPath: string,
): FunctionType | undefined => {
	// Build a program using the set of root file names in fileNames
	const program = createProgram([inputPath], {
		target: ScriptTarget.Latest,
	});
	let functionType: FunctionType | undefined;

	// Visit every sourceFile in the program
	for (const sourceFile of program.getSourceFiles()) {
		if (!sourceFile.isDeclarationFile) {
			// Walk the tree to search for classes
			forEachChild(sourceFile, (node) => {
				if (isNodeExported(node) && isVariableStatement(node)) {
					const declaration = node.declarationList.declarations[0];
					const declarationName = declaration.name.getText();

					// TODO get deploy options by reading the 2nd parameter of the function
					// TODO get absolute path of the file
					if (
						functionTypes.includes(declarationName as FunctionType)
					) {
						functionType = declarationName as FunctionType;
					}
					return;
				}
			});
			if (functionType) {
				return functionType;
			}
		}
	}
	return functionType;
};

/**
 * Checks if the given typescript node has the exported flag. (e.g. export class
 * Foobar).
 *
 * @param node The node to check.
 */
const isNodeExported = (node: Node): boolean => {
	return checkForModifierFlag(node, 'Export');
};

/**
 * Checks if the given typescript node has the modifier flag matching the given
 * flag.
 *
 * @param node The node to check.
 * @param flag The flag to check for.
 */
const checkForModifierFlag = (
	node: Node,
	flag: keyof typeof ModifierFlags,
): boolean => {
	const flags = getCombinedModifierFlags(node as Declaration);
	return (flags & ModifierFlags[flag]) === ModifierFlags[flag];
};
