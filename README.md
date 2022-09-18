# nx-cloud-functions-deployer

![npm (nx-cloud-functions-deployer)](https://img.shields.io/npm/v/nx-cloud-functions-deployer)
![npm bundle size](https://img.shields.io/bundlephobia/min/nx-cloud-functions-deployer)

This is a plugin for [Nx](https://nx.dev) that adds support for deploying [Cloud Functions for Firebase](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds&gclid=CNmq16LU-_kCFa5IwgodA9cF8A).

## Features

-   Alias support (both for internal in the project and shared libs)
-   Support for multiple [environments](https://firebase.google.com/docs/functions/config-env)
-   Esbuild for faster builds
-   Detect changes and only deploy changed functions
-   No longer export all functions in a index.ts file, but deploy each function individually for smaller bundles
-   Configurable deploy options
-   Deploy with Node 16 and esm

## Install

```bash
pnpm i -D nx-cloud-functions-deployer
```

## Description

This plugin adds a `deploy` executor that will build and deploy your cloud functions.

It uses esbuild to bundle your functions and then uses the [firebase-tools](https://www.npmjs.com/package/firebase-tools) to deploy them.

### Prerequisites

-   You will need to have the [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed. Either globally or locally in your project. If you install it globally you have to set `packageManager` option to `global`.

```bash
pnpm i -D firebase-tools
```

### Helper Options

You need to import the helper functions from `nx-cloud-functions-deployer`. This will allow you to configure your functions and make the functions stronger typed. The helper functions are: `onCall`, `onRequest`, `onCreate`, `onUpdate`, `onDelete` and `schedule`.

#### Schedule Example

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

#### Firestore Example

When you use the firestore helper functions. The data will automatically convert the snapshot to

```typescript
{
	...documentSnapshot.data(),
	id: documentSnapshot.id,
}
```

The helper functions are: `onCreate`, `onUpdate`, `onDelete` or `onWrite`.

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

#### OnCall/onRequest Example

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

### Folder Structure

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

#### Database/Firestore Structure

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

The default function name for database/firestore functions will omit [id]. Example: `controllers/database/users/[id]/created.ts` will be deployed as `users_created`.

#### Custom Structure

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

## Usage

### Add the plugin to your project.json

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

### Options

| Option                  | Description                                                                                                                                                          | Default                           | Alias            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------- |
| `firebaseProjectProdId` | The firebase project id of the production flavor                                                                                                                     | required                          | `prodId`         |
| `firebaseProjectDevId`  | The firebase project id of the development flavor                                                                                                                    | required                          | `devId`          |
| `prod`                  | If true, use the `firebaseProjectProdId` and look for `prodEnvFileName`.                                                                                             | `false`                           | `production`     |
| `dev`                   | If true, use the `firebaseProjectDevId` and look for `devEnvFileName`.                                                                                               | `false`                           | `development`    |
| `outputDirectory`       | The output directory.                                                                                                                                                | `dist/<relative-path-to-project>` | `outDir`         |
| `tsConfig`              | The tsconfig file to use for the build in the project directory.                                                                                                     | `tsconfig.json`                   | `tsConfig`       |
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

#### Deploy examples

```bash
pnpm nx deploy functions --prod
```

```bash
pnpm nx deploy functions --dev
```

```bash
pnpm nx deploy functions --dev --only my_function,my_other_function --f
```
