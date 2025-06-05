# Universal Logger

A universal logging library that works seamlessly in both browser and Node.js environments with environment variable configuration and smart defaults.

## Features

- 🌍 **Universal**: Works in both browser and Node.js environments
- 🔧 **Configurable**: Environment variables with smart defaults
- 🎨 **Styled Output**: CSS colors in browser, ANSI colors in Node.js
- 💾 **Persistent**: Browser settings saved to localStorage
- 🏷️ **Categories**: Organize logs by feature/module
- 📊 **Log Levels**: DEBUG, INFO, WARN, ERROR, SILENT
- 🚀 **Zero Dependencies**: Lightweight and secure
- 📝 **TypeScript**: Full type safety and IntelliSense

## Quick Start

```bash
npm install universal-logger
```

```typescript
import logger from 'universal-logger';

// Works immediately with smart defaults
logger.info('Application started');
logger.debug('Debug information');
logger.warn('Warning message');
logger.error('Error occurred');

// With categories
logger.info('User logged in', 'auth');
logger.error('API request failed', 'api');
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
