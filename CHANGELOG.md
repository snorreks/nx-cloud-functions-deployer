# nx-cloud-functions-deployer

## 1.1.0

### Changes

-   Added support for AWS SAM deploy and logs
-   Removed esbuild-plugin-alias, now esbuild looks directly at tsconfig.json for paths
-   Made import paths relative to fix for windows users
-   Added CFD_FUNCTION_NAME env to each function, so you can use it in your code, example setting tags to sentry.
-

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
