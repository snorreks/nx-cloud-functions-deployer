# nx-cloud-functions-deployer

![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A) to your workspace.

## Install

```bash
pnpm i -D nx-cloud-functions-deployer
```

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

The plugin expects your project to have the following structure:

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

The function names will be the path from the `api/callable/database/scheduler` folder to the file. For example, the function `controllers/api/stripe/webhook_endpoint.ts` will be deployed as `stripe_webhook_endpoint`.

#### Database Structure

The databse structure is a little different. The plugin expects the folder structure to match to structure in the database. For example, if you have a database structure like this:

```bash
├── users # collection
│   ├── uid # a user document
│   │  ├── notifications # a subcollection
│   │  │  ├── notificationId # a notification document in the subcollection
```

Then you would have the following folder structure:

```bash
├── your-nx-project
│   ├──src
│   │  ├── controllers
│   │  │  ├── database
│   │  │  │  ├── users
│   │  │  │  │  ├── [uid]
│   │  │  │  │  │  ├── created.ts # will be called everytime a user document is created.
│   │  │  │  │  │  ├── updated.ts # will be called everytime a user document is updated.
│   │  │  │  │  │  ├── deleted.ts # will be called everytime a user document is deleted.
│   │  │  │  │  │  ├── notifications
│   │  │  │  │  │  │  ├── [notificationId]
│   │  │  │  │  │  │  │  ├── created.ts # will be called everytime a notification document is created.
│   │  │  │  │  │  │  │  ├── updated.ts # will be called everytime a notification document is updated.
│   │  │  │  │  │  │  │  ├── deleted.ts # will be called everytime a notification document is deleted.
```

Also the databse trigger functions will omit [id]. Example: `controllers/database/users/[id]/created.ts` will be deployed as `users_created`.

## Usage

### Add the plugin to your project.json

```json
...
	"targets": {
		"check": {
			"executor": "nx-cloud-functions-deployer:deploy",
			"options": {
				"firebaseProjectId": "my-firebase-project-id",
			}
		},
```

### Options

| Option                  | Description                                                                                                                     | Default                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `firebaseProjectId`     | The ID of the Firebase project to deploy to. If both `prod` and `dev` is false, this is required.                               | `undefined`                     |
| `firebaseProjectProdId` | The ID of the Firebase Production project to deploy to. If `prod` is true this is required.                                     | `undefined`                     |
| `firebaseProjectDevId`  | The ID of the Firebase Development project to deploy to. If `dev` is true this is required.                                     | `undefined`                     |
| `prod`                  | If this is a production firebase project enviroment or not.                                                                     | `false`                         |
| `dev`                   | If this is a development firebase project enviroment or not.                                                                    | `false`                         |
| `outputDirectory`       | The output directory to all the compiled deployed functions.                                                                    | `dist/{projectRoot}`            |
| `alias`                 | Support for alias. See [esbuild-plugin-alias](https://www.npmjs.com/package/esbuild-plugin-alias)                               | The paths in tsconfig.base.json |
| `region`                | The region where to host the cloud funciton. See [Cloud Functions Locations](https://cloud.google.com/functions/docs/locations) | `us-central1`                   |

It is reccommended to leave firebaseProjectId undefined and have firebaseProjectProdId and firebaseProjectDevId set. This will allow you to change target in cli:

```bash
pnpm nx deploy functions --prod
```

```bash
pnpm nx deploy functions --dev
```
