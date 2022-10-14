# nx-cloud-functions-deployer<!-- omit in toc -->

![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A).

- [Features](#features)
- [Install](#install)
- [Description](#description)
- [Prerequisites](#prerequisites)
- [Helper Functions](#helper-functions)
	- [Schedule Example](#schedule-example)
	- [Firestore Example](#firestore-example)
	- [Https Example](#https-example)
	- [Runtime Options](#runtime-options)
	- [Cloud functions v2 Example](#cloud-functions-v2-example)
- [Folder Structure](#folder-structure)
	- [Database/Firestore Structure](#databasefirestore-structure)
	- [Custom Structure](#custom-structure)
- [Cloud cache](#cloud-cache)
- [Executors](#executors)
	- [Deploy](#deploy)
		- [Options](#options)
		- [Examples](#examples)
	- [Script](#script)
		- [Options](#options-1)
		- [Examples](#examples-1)

## Features

-   Auto alias support
-   Support for multiple [environments](https://firebase.google.com/docs/functions/config-env)
-   Esbuild for faster builds
-   Detect changes and only deploy changed functions
-   No longer export all functions in a index.ts file, but deploy each function individually for smaller bundles
-   Configurable deploy options
-   Deploy with Node 16 and esm
-   Cloud functions v2 support

## Install

```bash
pnpm i -D nx-cloud-functions-deployer
```

## Description

This plugin adds a `deploy` executor that will build and deploy your cloud functions.

It uses esbuild to bundle your functions and then uses the [firebase-tools](https://www.npmjs.com/package/firebase-tools) to deploy them.

## Prerequisites

-   You will need to have the [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed. Either globally or locally in your project. If you install it globally you have to set `packageManager` option to `global`.

```bash
pnpm i -D firebase-tools
```

If you want to use [Cloud cache](#cloud-cache) or run [scripts](#script) you will also need [tsx](https://www.npmjs.com/package/tsx) installed.

```bash
pnpm i -D tsx
```

## Helper Functions

You need to import the helper functions from `nx-cloud-functions-deployer`. This will allow you to configure your functions and make the functions stronger typed. The helper functions are:

| Name                     | `firebase-functions` equivalent   | Description                |
| ------------------------ | --------------------------------- | -------------------------- |
| `onCall`                 | `https.onCall`                    |
| `onRequest`              | `https.onRequest`                 |
| `onCallV2`               | `https.onCall`                    | Cloud functions v2         |
| `onRequestV2`            | `https.onRequest`                 | Cloud functions v2         |
| `onWrite`                | `firestore.document.onWrite`      | See FirestoreExample       |
| `onCreate`               | `firestore.document.onCreate`     | See FirestoreExample       |
| `onUpdate`               | `firestore.document.onUpdate`     | See FirestoreExample       |
| `onDelete`               | `firestore.document.onDelete`     | See FirestoreExample       |
| `onDocumentWrite`        | `firestore.document.onWrite`      | Does not wrap the change   |
| `onDocumentCreate`       | `firestore.document.onCreate`     | Does not wrap the snapshot |
| `onDocumentUpdate`       | `firestore.document.onUpdate`     | Does not wrap the change   |
| `onDocumentDelete`       | `firestore.document.onDelete`     | Does not wrap the snapshot |
| `onRefWrite`             | `database.ref.onWrite`            |
| `onRefCreate`            | `database.ref.onCreate`           |
| `onRefUpdate`            | `database.ref.onUpdate`           |
| `onRefDelete`            | `database.ref.onDelete`           |
| `onObjectArchive`        | `storage.object.onArchive`        |
| `onObjectDelete`         | `storage.object.onDelete`         |
| `onObjectFinalize`       | `storage.object.onFinalize`       |
| `onObjectMetadataUpdate` | `storage.object.onMetadataUpdate` |
| `schedule`               | `pubsub.schedule`                 |
| `topic`                  | `pubsub.topic`                    |

### Schedule Example

For schedule functions options.schedule is required.

```typescript
import { schedule } from 'nx-cloud-functions-deployer';

export default schedule(
	(context) => {
		console.log('daily', context);
	},
	{
		schedule: 'every day 00:00',
	},
);
```

### Firestore Example

When you use the `onWrite`, `onCreate`, `onUpdate` or `onDelete` helper functions for firestore. The data will automatically convert the snapshot to

```typescript
{
	...documentSnapshot.data(),
	id: documentSnapshot.id,
}
```

```typescript
// shared lib
import type { CoreData } from 'nx-cloud-functions-deployer';
export interface UserData extends CoreData {
	email: string;
}
```

```typescript
import { onCall } from 'nx-cloud-functions-deployer';
import type { UserData } from '@my-project/shared';
export default onCreate<UserData>((user) => {
	console.log(`User ${user.email} created`);
});
```

### Https Example

onCall and onRequest can give even better typing with frontend. By importing a interface from a shared file.

```typescript
// shared lib
export type MyFunctions = {
	my_function_name: [
		{
			message: string; // request data
		},
		{
			response: boolean; // response data
		},
	];
};
```

```typescript
import { onCall } from 'nx-cloud-functions-deployer';
import type { MyFunctions } from '@my-project/shared';

export default onCall<MyFunctions, 'my_function_name'>((data, context) => {
	console.log(data); // { message: string }
	return { response: true };
});
```

### Runtime Options

To configure runtime options you can use the `runtimeOptions` option.

```typescript
import { onCall } from 'nx-cloud-functions-deployer';

export default onCall(
	(data, context) => {
		return { response: true };
	},
	{
		runtimeOptions: {
			timeoutSeconds: 60,
			memory: '2GB',
		},
	},
);
```

### Cloud functions v2 Example

To enable cloud functions v2 you can use the `v2` to true in `onCall` and `onRequest` options.

NB: the default function name can not be snake_case anymore, it will have no under score in it.

See https://firebase.google.com/docs/functions/beta#other_limitations

```typescript
// api/my-function-name.ts
import { onCallV2 } from 'nx-cloud-functions-deployer';
import type { MyFunctions } from '@my-project/shared';

export default onCallV2<MyFunctions, 'my_function_name'>(
	(data, context) => {
		console.log(data); // { message: string }
		return { response: true };
	},
	{
		v2: true,
	},
); // the function name will be => myfunctionname
```

## Folder Structure

See the [example](https://github.com/snorreks/nx-cloud-functions-deployer/tree/master/example/apps/functions/src/controllers) for a better understanding of the folder structure.

It is recommend to have the following folder structure, but it is not required.

```bash

├── your-nx-project
│   ├──src
│   │  ├── controllers
│   │  │  ├── https
│   │  │  │  ├── callable
│   │  │  │  ├── request
│   │  │  ├── database
│   │  │  ├── firestore
│   │  │  ├── storage
│   │  │  ├── pubsub
│   │  │  │  ├── schedule
│   │  │  │  ├── topic

```

The folders in controllers will different deployment types:

-   `request` - [HTTP requests](https://firebase.google.com/docs/functions/http-events)
-   `callable` - [Callable functions](https://firebase.google.com/docs/functions/callable)
-   `firestore` - [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events)
-   `database` - [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events)
-   `schedule` - [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)
-   `topic` - [Topic functions](https://firebase.google.com/docs/functions/pubsub-events)
-   `storage` - [Cloud Storage triggers](https://firebase.google.com/docs/functions/gcp-storage-events)

The default function names will be the path from the `api/callable/database/scheduler` folder to the file. For example, the function `controllers/api/stripe/webhook_endpoint.ts` will be deployed as `stripe_webhook_endpoint`.

### Database/Firestore Structure

The database/firestore structure is a little different. It is recommend the folder structure to match to structure in the database/firestore. For example, if you have a firestore structure like this:

```bash
├── users # collection
│   ├── uid # a user document
│   │  ├── notifications # a sub collection
│   │  │  ├── notificationId # a notification document in the sub collection
```

Then you would have the following folder structure:

```bash
├── database/firestore
│  ├── users
│  │  ├── [uid]
│  │  │  ├── created.ts # will be called every time a user document is created.
│  │  │  ├── updated.ts # will be called every time a user document is updated.
│  │  │  ├── deleted.ts # will be called every time a user document is deleted.
│  │  │  ├── notifications
│  │  │  │  ├── [notificationId]
│  │  │  │  │  ├── created.ts # will be called every time a notification document is created.
```

The default function name for database/firestore functions will omit `[id]`. Example: `controllers/database/users/[id]/created.ts` will be deployed as `users_created`.

### Custom Structure

To customize the folder structure, change the `functionsDirectory` in options.
If you change the structure you have to specify the `documentPath` for firestore functions and `ref` for database functions.

Example:

```typescript
// controllers/firestore/my-custom-user-created-file.ts
import { onCreate } from 'nx-cloud-functions-deployer';
import type { UserData } from '@my-project/shared';

export default onCreate<UserData>(
	(user) => {
		console.log(`User ${user.email} created`);
	},
	{
		functionName: 'custom_function_name',
		documentPath: 'users/{id}',
	},
);
```

## Cloud cache

The plugin will detect changes on the deployed functions locally. But it is also possible to cache the changes for the deployed functions on your own server. To do this create a file in the project directory called `functions-cache.dev.ts`
and `functions-cache.prod.ts`.
The file needs to export two function `fetch` and `update` which will be called by the plugin.

```typescript
import type {
	FunctionsCacheFetch,
	FunctionsCacheUpdate,
} from 'nx-cloud-functions-deployer';

export const fetch: FunctionsCacheFetch = async () => {
	// fetch the cache from the cloud
};

export const update: FunctionsCacheUpdate = async (newFunctionsCache) => {
	// update the cache in the cloud
};
```

See the [example](https://github.com/snorreks/nx-cloud-functions-deployer/blob/master/example/apps/functions/cloud-cache.ts) for how to setup cloud cache with [jsonbin](https://jsonbin.io/)

## Executors

### Deploy

```json
...
	"targets": {
		"deploy": {
			"executor": "nx-cloud-functions-deployer:deploy",
			"options": {
				"firebaseProjectProdId": "my-firebase-production-project-id",
				"firebaseProjectDevId": "my-firebase-development-project-id", // just use the same as prod if you don't have a dev project
			}
		},
```

#### Options

| Option                  | Description                                                                                                                                                          | Default                           | Alias            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------- |
| `firebaseProjectProdId` | The firebase project id of the production flavor                                                                                                                     | required                          | `prodId`         |
| `firebaseProjectDevId`  | The firebase project id of the development flavor                                                                                                                    | required                          | `devId`          |
| `prod`                  | If true, use the `firebaseProjectProdId` and look for `prodEnvFileName`.                                                                                             | `false`                           | `production`     |
| `dev`                   | If true, use the `firebaseProjectDevId` and look for `devEnvFileName`.                                                                                               | `false`                           | `development`    |
| `outputDirectory`       | The output directory.                                                                                                                                                | `dist/<relative-path-to-project>` | `outDir`         |
| `tsconfig`              | The tsconfig file to use for the build in the project directory.                                                                                                     | `tsconfig.json`                   | `tsconfig`       |
| `region`                | The default region to deploy the functions, if it is not set in the deploy file. See [Cloud Functions Locations](https://cloud.google.com/functions/docs/locations). | `us-central1`                     | `location`       |
| `silent`                | Whether to suppress all logs.                                                                                                                                        | `false`                           | `s`              |
| `verbose`               | Whether to run the command with verbose logging.                                                                                                                     | `false`                           | `v`              |
| `concurrency`           | The number of functions to deploy in parallel                                                                                                                        | `10`                              | `c`              |
| `devEnvFileName`        | The name of the environment file for the development flavor in the project root.                                                                                     | `.env.dev`                        | `devEnv`         |
| `prodEnvFileName`       | The name of the environment file for the production flavor the project root                                                                                          | `.env.prod`                       | `prodEnv`        |
| `envString`             | Stringify version of the environment. This is useful when you want to deploy using CI/CD.                                                                            | undefined                         | `ciEnv`          |
| `only`                  | Only deploy the given function names separated by comma                                                                                                              | undefined                         | `o`              |
| `force`                 | Force deploy all functions, even if no files changed                                                                                                                 | `false`                           | `f`              |
| `packageManager`        | The package manager to use for deploying with firebase-tools. Either: `pnpm`, `npm`, `yarn` or `global`.                                                             | `pnpm`                            | `pm`             |
| `dryRun`                | If true, then it will only build the function and not deploy them.                                                                                                   | `false`                           | `d`, `dry`       |
| `functionsDirectory`    | Relative path from the project root to the functions directory.                                                                                                      | `src/controllers`                 | `inputDirectory` |

#### Examples

```bash
pnpm nx deploy functions --prod
```

```bash
pnpm nx deploy functions --dev
```

```bash
pnpm nx deploy functions --dev --only my_function,my_other_function --f
# will deploy only the functions my_function and my_other_function
# and deploy them even if no files have changed
```

### Script

The plugin also provide support to run scripts locally. The plugin will run any files in the `scripts` directory. The files needs to export default a function.

Create a `functions-config.dev.ts` and `functions-config.prod.ts` file in the project root. In these files you set the environment and run any functions before executing a script.

```json
...
	"targets": {
		"script": {
			"executor": "nx-cloud-functions-deployer:script",
			"options": {
				"firebaseProjectProdId": "my-firebase-production-project-id",
				"firebaseProjectDevId": "my-firebase-development-project-id", // just use the same as prod if you don't have a dev project
			}
		},
```

#### Options

| Option                  | Description                                                                          | Default         | Alias         |
| ----------------------- | ------------------------------------------------------------------------------------ | --------------- | ------------- |
| `firebaseProjectProdId` | The firebase project id of the production flavor                                     | required        | `prodId`      |
| `firebaseProjectDevId`  | The firebase project id of the development flavor                                    | required        | `devId`       |
| `prod`                  | If true, use the `firebaseProjectProdId` and look for `prodEnvFileName`.             | `false`         | `production`  |
| `dev`                   | If true, use the `firebaseProjectDevId` and look for `devEnvFileName`.               | `false`         | `development` |
| `tsconfig`              | The tsconfig file to use for the script in the project directory.                    | `tsconfig.json` | `tsconfig`    |
| `silent`                | Whether to suppress all logs.                                                        | `false`         | `s`           |
| `verbose`               | Whether to run the command with verbose logging.                                     | `false`         | `v`           |
| `scriptsRoot`           | Relative path from the project root to the scripts directory.                        | `scripts`       |               |
| `runPrevious`           | Rerun the last executed script.                                                      | `false`         | `p`           |
| `script`                | The name of the script to run. If not set, it will prompt you to select from a list. | undefined       | `file`        |

#### Examples

```bash
pnpm nx script functions --prod
```

```bash
pnpm nx script functions --dev
```

```bash
pnpm nx script functions --dev -p
# will run the last executed script in development
```
