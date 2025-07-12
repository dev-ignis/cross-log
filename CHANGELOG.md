# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Examples for Edge Runtime and Next.js usage

### Changed
- **BREAKING**: Environment detection now uses runtime-specific detection instead of simple browser/node checks
- Improved TypeScript declarations with proper exports for each entry point
- Enhanced ESM/CJS dual package support with conditional exports

### Fixed
- Environment variable access in Edge Runtime environments
- Module resolution for framework-specific imports

## [0.3.1] - Previous version
- Bug fixes and improvements

## [0.3.0] - Previous version
- Initial stable release