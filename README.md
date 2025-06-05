# Universal Logger

A universal logging package that works seamlessly in both browser and Node.js environments with environment variable configuration and zero dependencies.

[![npm version](https://badge.fury.io/js/universal-logger.svg)](https://badge.fury.io/js/universal-logger)
[![CI](https://github.com/dev-ignis/universal-logger/workflows/CI/badge.svg)](https://github.com/dev-ignis/universal-logger/actions)
[![Coverage Status](https://coveralls.io/repos/github/dev-ignis/universal-logger/badge.svg?branch=master)](https://coveralls.io/github/dev-ignis/universal-logger?branch=master)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org)

## ✨ Features

- **🌍 Universal**: Single package works in browser and Node.js
- **⚙️ Environment-driven**: Configuration via environment variables with smart defaults
- **🪶 Zero dependencies**: Lightweight and secure
- **📘 TypeScript-first**: Full type safety and IntelliSense
- **🔄 Backward compatible**: Drop-in replacement for console logging
- **🎨 Styled output**: Colors in browser console and ANSI colors in terminal
- **💾 Persistent storage**: Browser localStorage integration for settings
- **🏷️ Category-based**: Organize logs by categories with individual control
- **⚡ Performance-optimized**: Duplicate log prevention and minimal overhead when disabled

## 📦 Installation

```bash
npm install universal-logger
```

## 🚀 Quick Start

### Zero Configuration (Recommended)

```typescript
import logger from 'universal-logger';

// Works immediately with smart defaults
logger.info('Application started');     // ✅ Always shown
logger.debug('Debug information');      // ✅ Shown in development
logger.warn('Warning message');         // ⚠️ Always shown
logger.error('Error occurred');         // ❌ Always shown
```

### With Custom Configuration

```typescript
import { createLogger, LogLevel } from 'universal-logger';

const logger = createLogger({
  minLevel: LogLevel.WARN,
  showTimestamp: true,
  colors: { enabled: false }
});

logger.warn('This will show');
logger.debug('This will not show');
```

## Environment Configuration

Configure via environment variables (all optional with smart defaults):

```bash
# Core settings
LOG_LEVEL=DEBUG                    # DEBUG, INFO, WARN, ERROR, SILENT
LOGGER_ENABLED=true                # Enable/disable logging

# Features
LOGGER_TIMESTAMPS=true             # Include timestamps
LOGGER_STACK_TRACES=true           # Include stack traces for errors
LOGGER_COLORS=true                 # Enable colored output

# Browser storage
LOGGER_STORAGE_ENABLED=true        # Save settings to localStorage
LOGGER_STORAGE_KEY_PREFIX=myapp    # Storage key prefix

# Browser controls
LOGGER_BROWSER_CONTROLS=true       # Enable window.* helper functions
LOGGER_WINDOW_NAMESPACE=__myLogger # Window object namespace

# Custom colors
LOGGER_COLOR_DEBUG=#6EC1E4         # Browser CSS colors
LOGGER_COLOR_INFO=#4A9FCA
LOGGER_COLOR_WARN=#FBC02D
LOGGER_COLOR_ERROR=#D67C2A

LOGGER_ANSI_DEBUG=36               # Node.js ANSI color codes
LOGGER_ANSI_INFO=36
LOGGER_ANSI_WARN=33
LOGGER_ANSI_ERROR=31
```

## Advanced Usage

### Custom Configuration

```typescript
import { createLogger, LogLevel } from 'universal-logger';

const logger = createLogger({
  minLevel: LogLevel.INFO,
  showTimestamp: false,
  colors: {
    enabled: true,
    browser: {
      info: '#custom-color'
    }
  }
});
```

### Category Management

```typescript
// Enable specific categories
logger.enableCategory('api', LogLevel.DEBUG);
logger.enableCategory('ui', LogLevel.INFO);

// Disable noisy categories
logger.disableCategory('metrics');

// Use categories
logger.debug('Database query executed', 'db');
logger.info('Component rendered', 'ui');
```

### Browser Console Controls

In development, use these browser console functions:

```javascript
// Enable all logging
window.enableUniversalLoggerLogging();

// Disable all logging
window.disableUniversalLoggerLogging();

// Check status
window.universalLoggerLoggingStatus();

// Access logger directly
window.__universalLogger.setLevel(0);
```

## Environment-Specific Defaults

| Environment | LOG_LEVEL | COLORS | BROWSER_CONTROLS | STORAGE |
|-------------|-----------|--------|------------------|---------|
| **Development Browser** | DEBUG | ✅ | ✅ | ✅ |
| **Production Browser** | WARN | ✅ | ❌ | ✅ |
| **Development Node.js** | DEBUG | ✅ | ❌ | ❌ |
| **Production Node.js** | WARN | ❌ | ❌ | ❌ |

## API Reference

### Logger Methods

- `debug(message, category?, ...args)` - Debug level logging
- `info(message, category?, ...args)` - Info level logging  
- `warn(message, category?, ...args)` - Warning level logging
- `error(message, category?, ...args)` - Error level logging

### Configuration Methods

- `setLevel(level)` - Set minimum log level
- `configure(config)` - Update configuration
- `enableCategory(name, level?)` - Enable category logging
- `disableCategory(name)` - Disable category logging
- `enableAll()` - Enable all logging
- `disableAll()` - Disable all logging
- `getConfig()` - Get current configuration
- `isEnabled()` - Check if logging is enabled

## License

MIT
