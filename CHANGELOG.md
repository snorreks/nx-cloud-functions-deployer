# nx-cloud-functions-deployer

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

## 0.1.0

### Minor Changes

-   Initial release
