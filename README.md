# nx-cloud-functions-deployer

![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A) to your workspace.

## Description

This plugin adds a `deploy` executor to the `@nx-cloud-functions-deployer/deploy` builder. This executor will deploy your Cloud Functions to Google Cloud.

It uses esbuild to bundle your functions and then uses the [firebase-tools](https://www.npmjs.com/package/firebase-tools) to deploy them.

## Install

```bash
pnpm i -D nx-cloud-functions-deployer
```

## Usage

### Add the plugin to your project.json

```json
...
	"targets": {
		"check": {
			"executor": "nx-cloud-functions-deployer:build",
			"options": {
				"firebaseProjectId": "my-firebase-project-id",
			}
		},
```

### Options

| Option                  | Description                                                                                       | Default              |
| ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------- |
| `firebaseProjectId`     | The ID of the Firebase project to deploy to. If both `prod` and `dev` is false, this is required. | `undefined`          |
| `firebaseProjectProdId` | The ID of the Firebase Production project to deploy to. If `prod` is true this is required.       | `undefined`          |
| `firebaseProjectDevId`  | The ID of the Firebase Development project to deploy to. If `dev` is true this is required.       | `undefined`          |
| `prod`                  | If this is a production firebase project enviroment or not.                                       | `false`              |
| `dev`                   | If this is a development firebase project enviroment or not.                                      | `false`              |
| `outputDirectory`       | The output directory to all the compiled deployed functions.                                      | `dist/{projectRoot}` |
| `tsConfigPath`          | The path to the tsconfig.json of the project.                                                     | `undefined`          |
| `alias`                 | Support for alias. See [esbuild-plugin-alias](https://www.npmjs.com/package/esbuild-plugin-alias) | `undefined`          |
