export const toRelativeDeployFilePath = (
	absolutePath: string,
	functionsDirectory: string,
): string => {
	const index = absolutePath.indexOf(functionsDirectory);
	if (index === -1) {
		return absolutePath;
	}
	return absolutePath.slice(index + functionsDirectory.length + 1);
};
