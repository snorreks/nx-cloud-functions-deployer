# nx-cloud-functions-deployer

## 3.0.0 (beta)

### Changes

-   Upgrade to nx 20
-   Upgrade to firebase-functions v6

## 2.5.0

### Changes

-   Emulate command (can now build all functions and emulate it with one firebase.json file)
-   Added auth triggers: onCreate, onDelete, beforeCreate, beforeDelete.
-   Added "minify" option to deploy command.

## 2.2.0

### Changes

-   Made esbuild work on linux
-   Added `deleteAll` option to delete all functions in a project.
-   Added new executable `read-env` to read the environment variables.

## 2.1.0

### Changes

-   Added `pnpmFix` option to fix pnpm install issues with firebase-tools and firebase-functions. It will npm install each functions and use the global firebase-tools to deploy.
-   Fix firestore and document function deploy

## 2.0.0

### Changes

-   Migrated all functions to v2.
-   Now all firestore triggers needs to be under `firestore` folder, `database` folder is not used for real time database triggers.
-   Removed v1 support for firebase functions, now only v2 is supported.

## 1.1.0

### Changes

-   Added support for AWS SAM deploy and logs
-   Removed esbuild-plugin-alias, now esbuild looks directly at tsconfig.json for paths
-   Made import paths relative to fix for windows users
-   Added CFD_FUNCTION_NAME env to each function, so you can use it in your code, example setting tags to sentry.

## 1.0.0

### Changes

-   Added support for multiple firebase projects, not just prod and dev
-   Updated function cache, the parameters are now a object instead of a string
    -   It now passes in the flavor
-   Removed firebaseProjectProdId, firebaseProjectDevId, prodEnvFileName and devEnvFileName
-   Made flavors required
-   Renamed dev to development and prod to production
-   Renamed functions-config.{flavor}.ts to script.config.{flavor}.ts
-   Now scripts can use prompts from the user
-   Support node18

## 0.1.0

### Minor Changes

-   Initial release
