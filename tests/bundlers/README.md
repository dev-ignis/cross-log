# Bundler Test Configurations

This directory contains test configurations for various bundlers to ensure cross-log works correctly with different build tools.

## Testing TypeScript & Module Support

### Prerequisites

First, build the main package:

```bash
cd ../..
npm run build
```

### Testing with Webpack

```bash
npm install --save-dev webpack webpack-cli ts-loader typescript
npx webpack --config webpack.test.js
```

### Testing with Vite

```bash
npm install --save-dev vite typescript
npx vite build --config vite.config.js
```

### Testing with Rollup

```bash
npm install --save-dev rollup @rollup/plugin-typescript typescript
npx rollup -c rollup.test.js
```

### Testing with esbuild

```bash
npm install --save-dev esbuild
npx esbuild test-app.ts --bundle --outfile=dist-esbuild/main.js
npx esbuild test-edge.ts --bundle --outfile=dist-esbuild/edge.js --platform=neutral
```

## What We're Testing

1. **TypeScript Types**: Proper type inference and exports
2. **Module Resolution**: ESM and CJS dual package support
3. **Conditional Exports**: Framework-specific entry points
4. **Partial Configuration**: Type-safe partial configs
5. **Tree Shaking**: Only importing used code
6. **Edge Runtime Compatibility**: No Node.js dependencies in edge builds

## Expected Results

All bundlers should:
- Successfully compile the TypeScript test files
- Properly resolve the conditional exports
- Generate working bundles with correct types
- Support both ESM and CJS imports
- Tree-shake unused code