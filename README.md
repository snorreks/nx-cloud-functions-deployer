# nx-cloud-functions-deployer<!-- omit in toc -->

[![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)](https://www.npmjs.com/package/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A).

From version 2.0.0 this plugin only supports cloud functions v2, if you want v1 support use version 1.2.2.

- [Features](#features)
- [Install](#install)
- [Description](#description)
- [Prerequisites](#prerequisites)
- [Helper Functions](#helper-functions)
    - [Schedule Example](#schedule-example)
    - [Auth Example](#auth-example)
    - [Database Example](#database-example)
    - [Firestore Example](#firestore-example)
    - [Https Example](#https-example)
    - [Assets and external dependencies](#assets-and-external-dependencies)
    - [Limitations](#limitations)
- [Folder Structure](#folder-structure)
    - [Firestore Structure](#firestore-structure)
    - [Custom Structure](#custom-structure)
- [Cloud cache](#cloud-cache)
- [Logger](#logger)
- [Executors](#executors)
    - [deploy](#deploy) - [deploy options](#deploy-options) - [deploy examples](#deploy-examples)
    - [script](#script) - [script options](#script-options) - [script examples](#script-examples)
    - [delete](#delete) - [delete options](#delete-options)
    - [emulate](#emulate) - [emulate options](#emulate-options)
    - [read-env](#read-env) - [read-env options](#read-env-options)
    - [rules](#rules)
    - [sam](#sam)

## Features

- Auto alias support
- Support for multiple [environments](https://firebase.google.com/docs/functions/config-env)
- Esbuild for faster builds
- Detect changes and only deploy changed functions
- No longer export all functions in a index.ts file, but deploy each function individually for smaller bundles
- Configurable deploy options
- Deploy with Node 14/16/18/20/22 and esm
- Cloud functions v2 support
- Deploy rules and indexes
- Execute scripts locally
- Read env file and copy to clipboard
- Cloud cache support
- Run emulators locally
- AWS SAM: build, deploy and watch logs for lambda functions

## Install

```bash
pnpm i -D nx-cloud-functions-deployer
```

## Description

This plugin adds a `deploy` executor that will build and deploy your cloud functions.

It uses esbuild to bundle your functions and then uses the [firebase-tools](https://www.npmjs.com/package/firebase-tools) to deploy them.

## Prerequisites

- You will need to have the [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed. Either globally or locally in your project. If you install it globally you have to set `packageManager` option to `global`.

```bash
pnpm i -D firebase-tools
```

If you want to use [Cloud cache](#cloud-cache) or run [scripts](#script) you will also need [tsx](https://www.npmjs.com/package/tsx) installed.

```bash
pnpm i -D tsx
```

## Helper Functions

You need to import the helper functions from `nx-cloud-functions-deployer`. This will allow you to configure your functions and make the functions stronger typed.

### Schedule Example

For schedule functions options.schedule is required.

```typescript
import { onSchedule } from 'nx-cloud-functions-deployer';

export default onSchedule(
	(context) => {
		console.log('daily', context);
	},
	{
		schedule: 'every day 00:00',
	},
);
```

### Auth Example

Auth triggers have the following functions: `onAuthCreate`, `onAuthDeleted`,`beforeAuthCreate` and `beforeAuthDeleted`.

```typescript
import { onAuthCreate } from 'nx-cloud-functions-deployer';

export default onAuthCreate(({ uid }) => {
	console.log('New user created: uid', uid);
});
```

### Database Example

Database triggers have the following functions: `onValueCreated`, `onValueDeleted`, `onValueUpdated` and `onValueWritten`. You must always add the `ref` for each database function.

```typescript
import { onValueCreated } from 'nx-cloud-functions-deployer';

export default onValueCreated(
	({ data }) => {
		console.log('New gmail user created:', data.val());
	},
	{
		ref: '/user/{data.key=*@gmail.com}',
	},
);
```

### Firestore Example

When you use the `onWritten`, `onCreated`, `onUpdated` or `onDeleted` helper functions for firestore. The data will automatically convert the snapshot to

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

export default onCreated<UserData>(({ data }) => {
	console.log(`User ${data.email} created`);
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

export default onCall<MyFunctions, 'my_function_name'>(({ data }) => {
	console.log(data); // { message: string }
	return { response: true };
});
```

### Assets and external dependencies

To include assets and external dependencies you can use the `assets` and `external` options.

External will install the dependencies in the function folder and add them to the package.json. This is useful for dependencies that do not work with bundle.

Assets will copy the files from src/assets to the dist folder (right next to index.js)

```typescript
import { onCall } from 'nx-cloud-functions-deployer';

export default onCall(
	({ data }) => {
		return { response: true };
	},
	{
		assets: ['test.png'],
		external: ['sharp'],
		keepNames: true,
	},
);
```

Also note that if you use sharp, you need keepNames: true. See [documentation](https://esbuild.github.io/api/#keep-names)

### Limitations

You cannot have comments, variables or [numeric separators](https://mariusschulz.com/blog/numeric-separators-in-typescript) in the options section. If the options section is invalid it will skip the options and deploy as default.

All these lines in the options are not allowed:

```typescript
import { onCall } from 'nx-cloud-functions-deployer';

const region = 'europe-west1';
const memory = '2GB';

export default onCall(
	(data, context) => {
		return { response: true };
	},
	{
		region,
		timeoutSeconds: 1_800,
		memory: memory,
		// a random comment
	},
);
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
|   |  |  ├── auth
│   │  │  ├── pubsub
│   │  │  │  ├── schedule
│   │  │  │  ├── topic

```

The folders in controllers will different deployment types:

- `request` - [HTTP requests](https://firebase.google.com/docs/functions/http-events)
- `callable` - [Callable functions](https://firebase.google.com/docs/functions/callable)
- `firestore` - [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events)
- `database` - [Cloud Firestore triggers](https://firebase.google.com/docs/functions/firestore-events)
- `schedule` - [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)
- `storage` - [Cloud Storage triggers](https://firebase.google.com/docs/functions/gcp-storage-events)
- `auth` - [Auth triggers](https://firebase.google.com/docs/functions/auth-events)

The default function names will be the path from the `api/callable/database/scheduler` folder to the file. For example, the function `controllers/api/stripe/webhook_endpoint.ts` will be deployed as `stripe_webhook_endpoint`.

### Firestore Structure

The firestore structure is a little different. It is recommend the folder structure to match to structure in the firestore. For example, if you have a firestore structure like this:

```bash
├── users # collection
│   ├── uid # a user document
│   │  ├── notifications # a sub collection
│   │  │  ├── notificationId # a notification document in the sub collection
```

Then you would have the following folder structure:

```bash
├── firestore
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
If you change the structure you have to specify the `document` for firestore functions and `ref` for database functions.

Example:

```typescript
// controllers/firestore/my-custom-user-created-file.ts
import { onCreated } from 'nx-cloud-functions-deployer';
import type { UserData } from '@my-project/shared';

export default onCreated<UserData>(
	({ data }) => {
		console.log(`User ${data.email} created`);
	},
	{
		functionName: 'custom_function_name',
		document: 'users/{id}',
	},
);
```

## Cloud cache

The plugin will detect changes on the deployed functions locally. But it is also possible to cache the changes for the deployed functions on your own server. To do this create a file in the project directory called `functions-cache.ts`.
The file needs to export two function `fetch` and `update` which will be called by the plugin. Note you will also get the environments, so you can use process.env, if you want to hide production secrets for fetching/updating the cache.

```typescript
import type {
	FunctionsCacheFetch,
	FunctionsCacheUpdate,
} from 'nx-cloud-functions-deployer';

export const fetch: FunctionsCacheFetch = async ({ flavor }) => {
	// fetch the cache from the cloud
};

export const update: FunctionsCacheUpdate = async ({
	flavor,
	newFunctionsCache,
}) => {
	// update the cache in the cloud
};
```

See the [example](https://github.com/snorreks/nx-cloud-functions-deployer/blob/master/example/apps/functions/functions-cache.ts) for how to setup cloud cache with [jsonbin](https://jsonbin.io/)

## Logger

If you want to see metric for each function (like opentelemetry or sentry) , add a logger.ts file in the src folder (see [example](https://github.com/snorreks/nx-cloud-functions-deployer/blob/master/example/apps/functions/src/logger.ts)). The logger will be build and added for each function.

## Executors

### deploy

```json
...
 "targets": {
  "deploy": {
   "executor": "nx-cloud-functions-deployer:deploy",
   "options": {
    "flavors": {
     "development": "firebase-project-development-id",
     "production": "firebase-project-production-id"
    }
   }
  },
```

#### deploy options

| Option               | Description                                                                                                                                                          | Default                           | Alias            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------- |
| `flavors`            | A object of the flavors to use, the key is the flavor name and value is the firebase project id.                                                                     | required                          |                  |
| `flavor`             | The flavor to use, default will be the first key in the `flavors` object                                                                                             |                                   |                  |
| `production`         | If true, the `flavor` will be 'production' if `flavor` is not defined                                                                                                | `false`                           | `prod`           |
| `development`        | If true, the `flavor` will be 'development' if `flavor` is not defined                                                                                               | `false`                           | `dev`            |
| `outputDirectory`    | The output directory.                                                                                                                                                | `dist/<relative-path-to-project>` | `outDir`         |
| `envFiles`           | the key is the flavor name and value is path to the env file, default is `.env.${flavor}`                                                                            |                                   |                  |
| `tsconfig`           | The tsconfig file to use for the build in the project directory.                                                                                                     | `tsconfig.json`                   | `tsconfig`       |
| `region`             | The default region to deploy the functions, if it is not set in the deploy file. See [Cloud Functions Locations](https://cloud.google.com/functions/docs/locations). | `us-central1`                     | `location`       |
| `silent`             | Whether to suppress all logs.                                                                                                                                        | `false`                           | `s`              |
| `verbose`            | Whether to run the command with verbose logging.                                                                                                                     | `false`                           | `v`              |
| `concurrency`        | The number of functions to deploy in parallel                                                                                                                        | `5`                               | `c`              |
| `envString`          | Stringify version of the environment. This is useful when you want to deploy using CI/CD.                                                                            | undefined                         | `ciEnv`          |
| `only`               | Only deploy the given function names separated by comma                                                                                                              | undefined                         | `o`              |
| `force`              | Force deploy all functions, even if no files changed                                                                                                                 | `false`                           | `f`              |
| `packageManager`     | The package manager to use for deploying with firebase-tools. Either: `pnpm`, `npm`, `yarn` or `global`.                                                             | `pnpm`                            | `pm`             |
| `dryRun`             | If true, then it will only build the function and not deploy them.                                                                                                   | `false`                           | `d`, `dry`       |
| `functionsDirectory` | Relative path from the project root to the functions directory.                                                                                                      | `src/controllers`                 | `inputDirectory` |
| `nodeVersion`        | The node version to use for the functions.                                                                                                                           | `20`                              | `node`           |
| `minify`             | Whether to minify the functions                                                                                                                                      | `true`                            |                  |

#### deploy examples

```bash
pnpm nx deploy functions --flavor production
```

```bash
pnpm nx deploy functions --development
```

```bash
pnpm nx deploy functions --development --only my_function,my_other_function --f
# will deploy only the functions my_function and my_other_function
# and deploy them even if no files have changed
```

### script

The plugin also provide support to run scripts locally. The plugin will run any files in the `scripts` directory. The files needs to export default a function.

```ts
import { firestore } from '$configs/firestore';
import type { ScriptFunction } from 'nx-cloud-functions-deployer';

export default (async ({ prompt }) => {
	console.log('prompt', prompt);
	const { uid } = await prompt<{ uid: string }>({
		type: 'input',
		name: 'uid',
		message: 'Enter the uid',
		validate: (value) => {
			if (value.length === 20) {
				return true;
			}

			return 'The uid must be 20 characters long';
		},
	});

	const documentSnap = await firestore.collection('users').doc(uid).get();

	if (!documentSnap.exists) {
		throw new Error('User not found');
	}
	return { id: documentSnap.id, ...documentSnap.data() };
}) satisfies ScriptFunction;
```

You can also add a `script-config.{flavor}.ts` file in the project root. In these files you can execute code before before running a script.

To make firebase work locally see [example](https://github.com/snorreks/nx-cloud-functions-deployer/blob/master/example/apps/functions/src/configs/app.ts).

```json
...
 "targets": {
  "script": {
   "executor": "nx-cloud-functions-deployer:script",
   "options": {
    "flavors": {
     "development": "firebase-project-development-id",
     "production": "firebase-project-production-id"
    }
   }
  },
```

#### script options

| Option        | Description                                                                                      | Default         | Alias      |
| ------------- | ------------------------------------------------------------------------------------------------ | --------------- | ---------- |
| `flavors`     | A object of the flavors to use, the key is the flavor name and value is the firebase project id. | required        |            |
| `flavor`      | The flavor to use, default will be the first key in the `flavors` object                         |                 |            |
| `production`  | If true, the `flavor` will be 'production' if not defined                                        | `false`         | `prod`     |
| `development` | If true, the `flavor` will be 'development' if not defined                                       | `false`         | `dev`      |
| `envFiles`    | the key is the flavor name and value is path to the env file, default is `.env.${flavor}`        |                 |            |
| `tsconfig`    | The tsconfig file to use for the script in the project directory.                                | `tsconfig.json` | `tsconfig` |
| `silent`      | Whether to suppress all logs.                                                                    | `false`         | `s`        |
| `verbose`     | Whether to run the command with verbose logging.                                                 | `false`         | `v`        |
| `scriptsRoot` | Relative path from the project root to the scripts directory.                                    | `scripts`       |            |
| `runPrevious` | Rerun the last executed script.                                                                  | `false`         | `p`        |
| `script`      | The name of the script to run. If not set, it will prompt you to select from a list.             | undefined       | `file`     |

#### script examples

```bash
pnpm nx script functions --production
```

```bash
pnpm nx script functions --flavor development
```

```bash
pnpm nx script functions --development -p
# will run the last executed script in development
```

### delete

The plugin provide support to delete unused function that are not in the project anymore. The plugin will delete any functions that are not in the `functions` directory.

```json
...
 "targets": {
  "delete-unused": {
   "executor": "nx-cloud-functions-deployer:delete",
   "options": {
    "flavors": {
     "development": "firebase-project-development-id",
     "production": "firebase-project-production-id"
    }
   }
  },
```

#### delete options

| Option        | Description                                                                                      | Default         | Alias      |
| ------------- | ------------------------------------------------------------------------------------------------ | --------------- | ---------- |
| `flavors`     | A object of the flavors to use, the key is the flavor name and value is the firebase project id. | required        |            |
| `flavor`      | The flavor to use, default will be the first key in the `flavors` object                         |                 |            |
| `production`  | If true, the `flavor` will be 'production' if not defined                                        | `false`         | `prod`     |
| `development` | If true, the `flavor` will be 'development' if not defined                                       | `false`         | `dev`      |
| `envFiles`    | the key is the flavor name and value is path to the env file, default is `.env.${flavor}`        |                 |            |
| `tsconfig`    | The tsconfig file to use for the script in the project directory.                                | `tsconfig.json` | `tsconfig` |
| `silent`      | Whether to suppress all logs.                                                                    | `false`         | `s`        |
| `verbose`     | Whether to run the command with verbose logging.                                                 | `false`         | `v`        |
| `deleteAll`   | Whether to delete all functions even if they are in your project.                                | `false`         |            |

### emulate

The plugin provide support to emulate functions locally. The plugin will emulate any functions that are in the `functions` directory.

```json
...
 "targets": {
  "emulate": {
   "executor": "nx-cloud-functions-deployer:emulate",
   "options": {
    "flavors": {
      "development": "firebase-project-development-id",
      "production": "firebase-project-production-id"
    },
 "only": ["functions"],
 "packageManager": "global",
 "minify": false
   }
  },
```

#### emulate options

| Option     | Description                                                                                                     | Default         | Alias      |
| ---------- | --------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| `flavors`  | A object of the flavors to use, the key is the flavor name and value is the firebase project id.                | required        |            |
| `flavor`   | The flavor to use, default will be the first key in the `flavors` object                                        |                 |            |
| `envFiles` | the key is the flavor name and value is path to the env file, default is `.env.${flavor}`                       |                 |            |
| `tsconfig` | The tsconfig file to use for the script in the project directory.                                               | `tsconfig.json` | `tsconfig` |
| `silent`   | Whether to suppress all logs.                                                                                   | `false`         | `s`        |
| `verbose`  | Whether to run the command with verbose logging.                                                                | `false`         | `v`        |
| `only`     | Only emulate the given services separated by comma "auth", "functions","firestore","hosting","pubsub","storage" | undefined       | `o`        |
| `minify`   | Whether to minify the functions                                                                                 | `true`          |            |

### read-env

This will read your .env file in your selected flavor, copy it to the clipboard and print it in console. This is so you can use `envString` when you deploy your functions in CI.

```json
...
 "targets": {
  "delete-unused": {
   "executor": "nx-cloud-functions-deployer:read-env",
   "options": {
    "flavors": {
     "development": "firebase-project-development-id",
     "production": "firebase-project-production-id"
    }
   }
  },
```

#### read-env options

| Option     | Description                                                                                      | Default  | Alias |
| ---------- | ------------------------------------------------------------------------------------------------ | -------- | ----- |
| `flavors`  | A object of the flavors to use, the key is the flavor name and value is the firebase project id. | required |       |
| `flavor`   | The flavor to use, default will be the first key in the `flavors` object                         |          |       |
| `envFiles` | the key is the flavor name and value is path to the env file, default is `.env.${flavor}`        |          |       |
| `silent`   | Whether to suppress all logs.                                                                    | `false`  | `s`   |
| `verbose`  | Whether to run the command with verbose logging.                                                 | `false`  | `v`   |

### rules

See the example [here](https://github.com/snorreks/nx-cloud-functions-deployer/tree/master/example/apps/rules).

### sam

There is now also support for aws sam to deploy and watch logs. You need the SAM CLI installed to use this feature. See the example [here](https://github.com/snorreks/nx-cloud-functions-deployer/tree/master/example/apps/aws).

```json
...
  "deploy": {
   "executor": "nx-cloud-functions-deployer:sam-deploy",
   "options": {
    "flavors": {
     "development": "example-dev-test"
    },
    "bucket": "test"
   }
  },
  "logs": {
   "executor": "nx-cloud-functions-deployer:sam-logs",
   "options": {
    "flavors": {
     "development": "example-dev-test"
    },
    "name": "ExampleFunction",
    "tail": true
   }
  }

```
