# Universal Logger API Reference

This document provides detailed information about the Universal Logger API, including all available methods, configuration options, and usage patterns.

## Table of Contents

- [Core Logger API](#core-logger-api)
- [Framework-Specific Imports](#framework-specific-imports)
- [Configuration](#configuration)
- [Categories](#categories)
- [Browser-Specific Features](#browser-specific-features)
- [Node.js-Specific Features](#nodejs-specific-features)
- [Edge Runtime Features](#edge-runtime-features)
- [Environment Variables](#environment-variables)
- [Types Reference](#types-reference)

## Core Logger API

### Logging Methods

```typescript
logger.debug(message: string, category?: string, ...args: any[]): void
logger.info(message: string, category?: string, ...args: any[]): void
logger.warn(message: string, category?: string, ...args: any[]): void
logger.error(message: string | Error, category?: string, ...args: any[]): void
```

Each method accepts:
- `message`: The main log message (string) or Error object (for error method only)
- `category` (optional): A string category to group related logs
- `...args` (optional): Additional data to log, like objects or arrays

### Log Levels

The logger supports the following log levels, in order of verbosity:

```typescript
enum LogLevel {
  DEBUG = 0,  // Most verbose
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4  // No logs
}
```

## Framework-Specific Imports

Cross-log provides specialized entry points for different environments:

### Default Import
```typescript
import logger from 'cross-log';
```
Auto-detects environment and uses appropriate logger.

### Edge Runtime
```typescript
import logger from 'cross-log/edge';
import { createEdgeLogger } from 'cross-log/edge';
```
For Vercel Edge Functions, Cloudflare Workers, and other Edge environments.

### Next.js
```typescript
import logger from 'cross-log/next';
import { createNextLogger } from 'cross-log/next';
```
Automatically switches between Edge and Node.js based on runtime context.

### Node.js
```typescript
import logger from 'cross-log/node';
import { createNodeLogger } from 'cross-log/node';
```
Full Node.js features with ANSI colors and process access.

### Browser
```typescript
import logger from 'cross-log/browser';
import { createBrowserLogger } from 'cross-log/browser';
```
Browser-optimized with localStorage and console features.

## Configuration

### Creating a Custom Logger

```typescript
import { createLogger, LogLevel } from 'cross-log';

const logger = createLogger({
  // Configuration options
  minLevel: LogLevel.INFO,
  enabled: true,
  showTimestamp: true,
  includeStackTrace: true,
  // ...more options
});
```

### Configuration Methods

```typescript
// Update minimum log level
logger.setLevel(LogLevel.WARN);

// Check if logging is enabled
const isEnabled = logger.isEnabled();

// Get current configuration
const config = logger.getConfig();

// Update configuration
logger.configure({
  showTimestamp: false,
  colors: { enabled: false }
});
```

### Complete Configuration Options

```typescript
interface LoggerConfig {
  // Core settings
  minLevel: LogLevel;
  enabled: boolean;
  
  // Features
  showTimestamp: boolean;
  includeStackTrace: boolean;
  
  // Colors
  colors: {
    enabled: boolean;
    browser?: {
      debug: string;
      info: string;
      warn: string;
      error: string;
    };
    node?: {
      debug: number;
      info: number;
      warn: number;
      error: number;
    };
  };
  
  // Browser-specific settings
  storage?: {
    enabled: boolean;
    keyPrefix: string;
  };
  
  // Browser controls
  browserControls?: {
    enabled: boolean;
    windowNamespace: string;
  };
}
```

## Categories

Categories allow you to organize logs by logical groups and control their visibility independently.

```typescript
// Enable a specific category with optional level
logger.enableCategory('api', LogLevel.DEBUG);

// Disable a specific category
logger.disableCategory('metrics');

// Log with a category
logger.info('User logged in', 'auth');
logger.debug('API request details', 'api', { endpoint: '/users', method: 'GET' });

// Check if a category is enabled
const isApiEnabled = logger.isCategoryEnabled('api');

// Get all enabled categories
const categories = logger.getEnabledCategories();
```

## Browser-Specific Features

### Local Storage Integration

When running in a browser environment, the logger can store settings in localStorage:

```typescript
// Storage is automatically used when enabled
logger.configure({
  storage: {
    enabled: true,
    keyPrefix: 'my_app_logger' // Customize storage key
  }
});
```

### Browser Console Controls

When `browserControls` is enabled, these functions are available in the browser console:

```javascript
// Enable all logging
window.enableUniversalLoggerLogging();

// Disable all logging
window.disableUniversalLoggerLogging();

// Get current status
window.universalLoggerLoggingStatus();

// Access logger directly with custom namespace
window.__universalLogger.setLevel(LogLevel.DEBUG);
```

## Node.js-Specific Features

### ANSI Color Support

In Node.js environments, the logger uses ANSI color codes for terminal output:

```typescript
logger.configure({
  colors: {
    enabled: true,
    node: {
      debug: 36,  // Cyan
      info: 32,   // Green
      warn: 33,   // Yellow
      error: 31   // Red
    }
  }
});
```

## Edge Runtime Features

### Edge-Safe Logger

The Edge Runtime logger is optimized for serverless edge environments:

```typescript
import { createEdgeLogger, LogLevel } from 'cross-log/edge';

const logger = createEdgeLogger({
  minLevel: LogLevel.INFO,
  showTimestamp: true,
  includeStackTrace: false, // Minimize overhead
  colors: { enabled: false } // No ANSI in Edge
});
```

### Runtime Detection

Cross-log automatically detects the runtime environment:

```typescript
import { detectRuntimeType, RuntimeType } from 'cross-log/edge';

const runtime = detectRuntimeType();
// Returns: 'edge', 'node', 'browser', 'deno', 'bun', or 'unknown'
```

### Environment Variables in Edge

Edge environments handle environment variables differently:

```typescript
import { getEnvironmentVariable } from 'cross-log/edge';

// Works across all environments
const logLevel = getEnvironmentVariable('LOG_LEVEL', 'INFO');
```

## Environment Variables

All configuration options can be set via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Minimum log level | `DEBUG` (dev), `WARN` (prod) |
| `LOGGER_ENABLED` | Enable/disable logging | `true` |
| `LOGGER_TIMESTAMPS` | Show timestamps | `true` |
| `LOGGER_STACK_TRACES` | Include stack traces | `true` |
| `LOGGER_COLORS` | Enable colored output | `true` (browser), `true` (Node.js dev), `false` (Node.js prod) |
| `LOGGER_STORAGE_ENABLED` | Save to localStorage | `true` (browser only) |
| `LOGGER_STORAGE_KEY_PREFIX` | Storage key prefix | `universal_logger` |
| `LOGGER_BROWSER_CONTROLS` | Enable window.* helpers | `true` (dev), `false` (prod) |
| `LOGGER_WINDOW_NAMESPACE` | Window object namespace | `__universalLogger` |
| `LOGGER_COLOR_DEBUG` | Debug color (CSS) | `#6EC1E4` |
| `LOGGER_COLOR_INFO` | Info color (CSS) | `#4A9FCA` |
| `LOGGER_COLOR_WARN` | Warning color (CSS) | `#FBC02D` |
| `LOGGER_COLOR_ERROR` | Error color (CSS) | `#D67C2A` |
| `LOGGER_ANSI_DEBUG` | Debug color (ANSI) | `36` (cyan) |
| `LOGGER_ANSI_INFO` | Info color (ANSI) | `36` (cyan) |
| `LOGGER_ANSI_WARN` | Warning color (ANSI) | `33` (yellow) |
| `LOGGER_ANSI_ERROR` | Error color (ANSI) | `31` (red) |

## Types Reference

Complete TypeScript type definitions are included with enhanced v0.4.0 types:

```typescript
// Log levels enum
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

// Partial configuration type for better inference
type PartialLoggerConfig = {
  enabled?: boolean;
  minLevel?: LogLevel;
  showTimestamp?: boolean;
  includeStackTrace?: boolean;
  categories?: Record<string, Partial<CategoryConfig>>;
  colors?: {
    enabled?: boolean;
    browser?: Partial<BrowserColorConfig>;
    ansi?: Partial<AnsiColorConfig>;
  };
  storage?: Partial<StorageConfig>;
  browserControls?: Partial<BrowserControlsConfig>;
};

// Logger interface
interface ILogger {
  debug(message: string, category?: string, ...args: any[]): void;
  info(message: string, category?: string, ...args: any[]): void;
  warn(message: string, category?: string, ...args: any[]): void;
  error(message: string | Error, category?: string, ...args: any[]): void;
  setLevel(level: LogLevel): void;
  configure(config: PartialLoggerConfig): void; // Now uses PartialLoggerConfig
  enableCategory(category: string, minLevel?: LogLevel): void;
  disableCategory(category: string): void;
  enableAll(): void;
  disableAll(): void;
  getConfig(): LoggerConfig;
  isEnabled(): boolean;
  Level: typeof LogLevel;
}

// Type guards
function isLogLevel(value: unknown): value is LogLevel;
function isLogLevelString(value: unknown): value is keyof typeof LogLevel;

// Configuration utilities
function mergeConfig(base: LoggerConfig, partial: PartialLoggerConfig): LoggerConfig;
```
