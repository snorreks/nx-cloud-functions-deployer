# nx-cloud-functions-deployer

![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A) to your workspace.

## Description

This plugin adds a `deploy` executor that will build and deploy cloud functions. This executor will deploy your Cloud Functions to Google Cloud.

It uses esbuild to bundle your functions and then uses the [firebase-tools](https://www.npmjs.com/package/firebase-tools) to deploy them.

### Prerequisites

-   It does not support javascript projects. You must use typescript.
-   Currenty only supports pnpm workspaces.
-   You will need to have the [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed.

```bash
pnpm i -D firebase-tools
```

### Folder Structure

The plugin expects your functions to be in a `functions` folder at the root of your workspace.

```bash

├── your-nx-project
│   ├──src
│   │  ├── controllers
│   │  │  ├── api/callable/database
```

The folders in controllers will different deployment types:

-   `api` - [HTTP requests](https://firebase.google.com/docs/functions/http-events) (functions.https.onRequest)
-   `callable` - [Callable functions](https://firebase.google.com/docs/functions/callable) (functions.https.onCall)
-   `database` - [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events) (functions.database.on\*)
    -   files ends with `created.ts` will be deployed as `functions.database.onCreate`
    -   files ends with `updated.ts` will be deployed as `functions.database.onUpdate`
    -   files ends with `deleted.ts` will be deployed as `functions.database.onDelete`
-   `scheduler` - [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions) (functions.pubsub.schedule) (not implemented yet)
-   `storage` - [Cloud Storage triggers](https://firebase.google.com/docs/functions/gcp-storage-events) (functions.storage.object()) (not implemented yet)

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
