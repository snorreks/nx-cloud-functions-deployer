# nx-cloud-functions-deployer-example

## Description

This is an example on how to use the plugin.

## Setup

```bash
cd .. && pnpm i && pnpm build && cd example && pnpm i
```

## Refreshing the example

```bash
cd .. && pnpm build && cd example && rm -rf node_modules/nx-cloud-functions-deployer && pnpm i
```

Go to

```bash
apps\functions\project.json
```

And rename firebaseProjectId with a firebase project id you have access to.

## Running the example

```bash
pnpm nx deploy functions
```
