# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-01-17

### Added
- Complete TypeScript plugin system with full type safety
- Builder pattern API for type-safe plugin composition (`createLoggerBuilder`)
- Configuration-based plugin setup (`createLoggerWithPlugins`)
- Zero type-casting required - all plugin methods fully typed
- Module augmentation support for custom plugins
- Type guards for runtime plugin checking (`hasPlugin`, `hasPlugins`)
- Type-safe wrapper utilities (`TypedLogger`, `PartialTypedLogger`)
- Comprehensive plugin TypeScript documentation
- Type tests for compile-time type safety verification

### Changed
- Plugin `use()` method now returns `ILogger` for better type compatibility
- Enhanced plugin system with proper TypeScript method inference
- Improved plugin manager with type-safe plugin access

## [0.4.0] - 2025-01-12

### Added
- Edge Runtime support for Vercel Edge Functions and Cloudflare Workers
- Framework-specific entry points:
  - `cross-log/edge` - Edge Runtime safe version
  - `cross-log/next` - Auto-detects Edge vs Node.js in Next.js
  - `cross-log/node` - Full Node.js features
  - `cross-log/browser` - Browser-optimized version
- Runtime detection for Edge, Deno, Bun environments
- Cross-platform environment variable support
- EdgeLogger class for Edge Runtime environments
- `PartialLoggerConfig` type for better TypeScript inference
- Type guards: `isLogLevel()` and `isLogLevelString()`
- `mergeConfig()` utility for type-safe configuration merging
- Environment-specific export conditions in package.json
- Comprehensive type exports from all adapter entry points
- Bundler test configurations for Webpack, Vite, Rollup, and esbuild

### Changed
- **BREAKING**: Environment detection now uses runtime-specific detection instead of simple browser/node checks
- **BREAKING**: `ILogger.configure()` now accepts `PartialLoggerConfig` instead of `Partial<LoggerConfig>` for better type inference
- Improved TypeScript declarations with proper exports for each entry point
- Enhanced ESM/CJS dual package support with conditional exports
- Better partial configuration handling with deep merging support

### Fixed
- Environment variable access in Edge Runtime environments
- Module resolution for framework-specific imports
- TypeScript strict mode compatibility issues
- Circular dependency in type definitions

## [0.3.1] - Previous version
- Bug fixes and improvements

## [0.3.0] - Previous version
- Initial stable release