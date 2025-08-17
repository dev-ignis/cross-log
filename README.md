# Cross-Log

A universal logging package that works seamlessly in both browser and Node.js environments with environment variable configuration and zero dependencies.

[![npm version](https://badge.fury.io/js/cross-log.svg)](https://badge.fury.io/js/cross-log)
[![CI](https://github.com/dev-ignis/cross-log/workflows/CI/badge.svg)](https://github.com/dev-ignis/cross-log/actions)
[![Coverage Status](https://coveralls.io/repos/github/dev-ignis/cross-log/badge.svg?branch=main)](https://coveralls.io/github/dev-ignis/cross-log?branch=main)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org)

## ✨ Features

- **🌍 Universal**: Single package works in browser and Node.js
- **🚀 Edge Runtime Support**: Works in Vercel Edge Functions and Cloudflare Workers
- **⚙️ Environment-driven**: Configuration via environment variables with smart defaults
- **🪶 Zero dependencies**: Lightweight and secure
- **📘 TypeScript-first**: Full type safety and IntelliSense
- **🔄 Backward compatible**: Drop-in replacement for console logging
- **🎨 Styled output**: Colors in browser console and ANSI colors in terminal
- **💾 Persistent storage**: Browser localStorage integration for settings
- **🏷️ Category-based**: Organize logs by categories with individual control
- **⚡ Performance-optimized**: Duplicate log prevention and minimal overhead when disabled
- **🔌 Plugin System**: Built-in plugins for API, Database, Analytics, Performance, and Security logging

## 📦 Installation

```bash
npm install cross-log
```

## 🚀 Edge Runtime Support (New in v0.4.0)

Cross-log now works seamlessly in Edge Runtime environments like Vercel Edge Functions and Cloudflare Workers!

### Framework-Specific Imports

```typescript
// For Edge Runtime environments (Vercel Edge, Cloudflare Workers)
import logger from 'cross-log/edge';

// For Next.js (automatically detects Edge vs Node runtime)
import logger from 'cross-log/next';

// For Node.js-only features
import logger from 'cross-log/node';

// For browser-optimized builds
import logger from 'cross-log/browser';
```

### Edge Runtime Example

```typescript
// In a Vercel Edge Function or Cloudflare Worker
import logger from 'cross-log/edge';

export default function handler(request: Request) {
  logger.info('Edge function called', 'api');
  
  try {
    // Your edge function logic
    return new Response('Success');
  } catch (error) {
    logger.error(error, 'api');
    return new Response('Error', { status: 500 });
  }
}
```

### Next.js Middleware Example

```typescript
import logger from 'cross-log/next';
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  // Automatically uses Edge-safe logger in middleware
  logger.info(`Middleware: ${request.method} ${request.url}`);
  return NextResponse.next();
}
```

## 🚀 Quick Start

### Zero Configuration (Recommended)

```typescript
import logger from 'cross-log';

// Works immediately with smart defaults
logger.info('Application started');     // ✅ Always shown
logger.debug('Debug information');      // ✅ Shown in development
logger.warn('Warning message');         // ⚠️ Always shown
logger.error('Error occurred');         // ❌ Always shown
```

### With Custom Configuration

```typescript
import { createLogger, LogLevel } from 'cross-log';

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
LOGGER_WINDOW_NAMESPACE=__Cross-Logger # Window object namespace

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
import { createLogger, LogLevel } from 'cross-log';

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

### 🔌 Plugin System with Full TypeScript Support (New in v0.5.0)

Cross-log now includes a powerful plugin system with **complete TypeScript support** for domain-specific logging patterns.

📚 **[Full TypeScript Plugin Documentation →](docs/TYPESCRIPT_PLUGINS.md)**

#### Key Features
- **Zero type casting required** - Full IDE autocomplete and type checking
- **Builder pattern** for type-safe plugin composition
- **Type guards** for runtime plugin checking
- **Module augmentation** support for custom plugins

#### Available Plugins

- **API Plugin**: HTTP request/response logging with session tracking
- **Database Plugin**: Query logging, transactions, and slow query detection
- **Analytics Plugin**: Event tracking for multiple providers
- **Performance Plugin**: Web Vitals, resource timing, and cache operations
- **Security Plugin**: Authentication events, access control, and vulnerability tracking

#### Basic Plugin Usage

```typescript
import { createLoggerBuilder, plugins } from 'cross-log';

// Type-safe plugin composition with builder pattern
const logger = createLoggerBuilder()
  .withPlugin(plugins.api({ includeSessionId: true }))
  .withPlugin(plugins.database({ truncateQueries: 100 }))
  .withPlugin(plugins.analytics({ providers: ['google', 'facebook'] }))
  .withPlugin(plugins.performance({ webVitals: true }))
  .withPlugin(plugins.security({ severity: true }))
  .build();

// All methods are fully typed - no casting or optional chaining needed!
logger.api.request('GET', '/api/users', 120, 200);
logger.database.query('SELECT * FROM users', 45, 10);
logger.analytics.event('PageView', 'facebook', { page: '/home' });
logger.performance.webVitals({ fcp: 1200, lcp: 2100 });
logger.security.authSuccess('user_123', '2fa');
```

For the classic API style or dynamic plugin loading, see the [TypeScript documentation](docs/TYPESCRIPT_PLUGINS.md#migration-guide).

#### API Plugin

```typescript
logger.use(plugins.api({
  includeSessionId: true,
  includeHeaders: false,
  truncateUrl: 150
}));

// Log API requests
logger.api?.request('GET', '/api/users', 120, 200);
logger.api?.response('/api/users', 200, 120, { users: [] });
logger.api?.error('POST', '/api/login', new Error('Invalid credentials'), 401);
```

#### Database Plugin

```typescript
logger.use(plugins.database({
  truncateQueries: 200,
  includeParams: true,
  slowQueryThreshold: 1000
}));

// Log database operations
logger.database?.query('SELECT * FROM users WHERE active = ?', 45, 10, [true]);
logger.database?.transaction('tx_123', 'begin');
logger.database?.transaction('tx_123', 'commit', 230);
logger.database?.slowQuery('SELECT * FROM orders JOIN products', 5000);
logger.database?.error('INSERT INTO logs', new Error('Connection lost'));
```

#### Analytics Plugin

```typescript
logger.use(plugins.analytics({
  providers: ['google', 'facebook', 'mixpanel'],
  includeUserContext: true
}));

// Track analytics events
logger.analytics?.event('button_click', 'google', { button: 'subscribe' });
logger.analytics?.pageView('/home', 'facebook');
logger.analytics?.conversion('purchase', 99.99, 'mixpanel', { product: 'premium' });
logger.analytics?.identify('user_123', { name: 'John Doe', plan: 'premium' });
```

#### Performance Plugin

```typescript
logger.use(plugins.performance({
  webVitals: true,
  resourceTiming: true,
  thresholds: {
    fcp: 1500,
    lcp: 2000,
    fid: 50,
    cls: 0.05,
    ttfb: 600
  }
}));

// Track performance metrics
logger.performance?.measure('api_call', 450);
logger.performance?.mark('page_load_start');
logger.performance?.webVitals({ fcp: 1200, lcp: 2100, cls: 0.05 });
logger.performance?.resource('script.js', 'script', 230, 45000);
logger.performance?.cache('hit', 'user_123');
```

#### Security Plugin

```typescript
logger.use(plugins.security({
  severity: true,
  includeIpAddress: false,
  includeUserAgent: true
}));

// Log security events
logger.security?.event('login_attempt', 'medium');
logger.security?.authFailure('Invalid password', 'user@example.com');
logger.security?.authSuccess('user_123', '2fa');
logger.security?.accessDenied('/admin', 'user_456', 'Insufficient privileges');
logger.security?.suspiciousActivity('multiple_login_failures', { attempts: 5 });
logger.security?.vulnerability('sql_injection', 'high', { endpoint: '/api/search' });
```

#### Real-World Integration Example

```typescript
// Express.js middleware with logging
async function apiMiddleware(req, res, next) {
  const startTime = Date.now();
  
  logger.api?.request(req.method, req.url);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.api?.response(req.url, res.statusCode, duration);
    
    if (duration > 1000) {
      logger.performance?.measure(`Slow API: ${req.url}`, duration);
    }
  });
  
  next();
}

// Database transaction with logging
async function performTransaction() {
  const txId = `tx_${Date.now()}`;
  
  try {
    logger.database?.transaction(txId, 'begin');
    
    const result = await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [123]);
    logger.database?.query('UPDATE users SET last_login = NOW() WHERE id = ?', 45, 1, [123]);
    
    logger.database?.transaction(txId, 'commit', 50);
    return result;
  } catch (error) {
    logger.database?.transaction(txId, 'rollback');
    logger.database?.error('Transaction failed', error);
    throw error;
  }
}
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

## ⚡ Performance

Universal Logger is designed to be lightweight and efficient. Here are the performance benchmarks:

```text
====================================
Benchmark Results
====================================
Disabled Logger: ~20,000,000 ops/sec
Production Logger: ~4,500,000 ops/sec
Development Logger: ~4,800,000 ops/sec
Filtered Category: ~4,400,000 ops/sec
Error Logging: ~5,000,000 ops/sec
Native Console.log: ~84,000,000 ops/sec
```

### Key Performance Insights

- **Disabled Logger**: Only 76% overhead vs native console (~20M ops/sec)
- **Development Logger**: 94% overhead with full features but still performs at ~4.8M ops/sec
- **Production Configurations**: All active logging configurations handle 4-5 million operations per second
- **Practical Impact**: Even at peak load, the performance impact is negligible for most applications

> Run your own benchmarks with `node tests/benchmarks/logger-benchmark.js` after building the package

## 🧪 Test Coverage

Universal Logger is thoroughly tested with both unit and integration tests for all environments.

```text
-------------------|----------|----------|---------|---------|-------------------
File               | % Stmts  | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|----------|----------|---------|---------|-------------------
All files          |    80.6  |    92.25 |   68.36 |   80.04 |                   
```

- **Unit Tests**: Cover individual components, utilities, and logger implementations
- **Integration Tests**: Ensure proper operation in both Node.js and browser environments
- **Cross-Environment Tests**: Verify consistent behavior across platforms

The test suite includes:

- API functionality testing
- Environment detection and adaptation
- Configuration inheritance and override validation
- Category filtering effectiveness
- Log level control validation

Run the tests with coverage report using:

```bash
npm run test -- --coverage
```

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

### Plugin Methods

- `use(plugin)` - Register a plugin with the logger
- `getPlugin(name)` - Get a registered plugin instance

### Plugin-Specific Methods

When plugins are registered, they add their methods to the logger:

- `logger.api` - API request/response logging methods
- `logger.database` - Database query and transaction logging
- `logger.analytics` - Analytics event tracking
- `logger.performance` - Performance metrics and Web Vitals
- `logger.security` - Security event logging

## License

MIT
