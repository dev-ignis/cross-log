# Basic Usage Guide

This guide covers the fundamental usage patterns for the Universal Logger.

## Installation

```bash
# Using npm
npm install omni-log

# Using yarn
yarn add omni-log
```

## Quick Start Examples

### Basic Logging

The simplest way to use Universal Logger is to import the default instance and start logging:

```typescript
import logger from 'omni-log';

// Basic logging
logger.debug('Detailed debug information');
logger.info('Application started successfully');
logger.warn('Configuration missing, using defaults');
logger.error('Failed to connect to API');

// Logging with additional data
logger.info('User logged in', { userId: '123', role: 'admin' });

// Logging errors
try {
  // Some code that might throw
  throw new Error('Database connection failed');
} catch (error) {
  logger.error(error);
  // Stack trace is automatically included
}
```

### Using Categories

Categories help organize logs by feature, component, or module:

```typescript
// Authentication-related logs
logger.debug('Validating token', 'auth');
logger.info('User authenticated successfully', 'auth', { userId: '123' });

// API-related logs
logger.debug('API request started', 'api', { endpoint: '/users', method: 'GET' });
logger.info('API request completed', 'api', { status: 200, duration: '120ms' });

// Database-related logs
logger.debug('Executing query', 'db', { query: 'SELECT * FROM users' });
logger.warn('Slow query detected', 'db', { duration: '2.5s' });
```

### Controlling Log Visibility

Control which logs are displayed:

```typescript
import { LogLevel } from 'omni-log';

// Set minimum log level globally
logger.setLevel(LogLevel.WARN);  // Only WARN and ERROR logs will show

// Control by category
logger.enableCategory('api', LogLevel.DEBUG);  // Show all API logs
logger.enableCategory('auth', LogLevel.INFO);  // Show INFO+ for auth
logger.disableCategory('metrics');             // Hide metrics logs

// Check status
const isEnabled = logger.isCategoryEnabled('api');
console.log(`API logging is ${isEnabled ? 'enabled' : 'disabled'}`);

// Temporarily enable/disable all logging
logger.disableAll();  // Stop all logs
// ... some code that would be noisy ...
logger.enableAll();   // Resume logging
```

## Environment-Based Configuration

Universal Logger automatically adapts to your environment:

```typescript
// In development:
// - DEBUG level is default
// - Colors enabled
// - Browser controls available
// - Stack traces included

// In production:
// - WARN level is default
// - Colors disabled in Node.js
// - Browser controls disabled
// - Stack traces still available
```

## Using with Modern Frameworks

### React

```typescript
// logger.ts
import { createLogger } from 'omni-log';

export const logger = createLogger({
  minLevel: process.env.NODE_ENV === 'development' ? 0 : 2
});

// Component.tsx
import { logger } from './logger';

function UserProfile({ userId }) {
  logger.debug('Rendering UserProfile', 'ui', { userId });
  
  useEffect(() => {
    logger.info('UserProfile mounted', 'lifecycle');
    return () => logger.debug('UserProfile unmounted', 'lifecycle');
  }, []);
  
  return <div>User Profile</div>;
}
```

### Node.js Express

```typescript
// logger.ts
import { createLogger, LogLevel } from 'omni-log';

export const logger = createLogger({
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
});

// server.ts
import express from 'express';
import { logger } from './logger';

const app = express();

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.debug(`${req.method} ${req.url} started`, 'http');
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level](
      `${req.method} ${req.url} ${res.statusCode}`,
      'http',
      { 
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent']
      }
    );
  });
  
  next();
});
```

## Best Practices

1. **Use categories consistently** - Define a set of standard categories and stick to them
2. **Log at the appropriate level**:
   - `DEBUG`: Detailed information for debugging
   - `INFO`: General information about application flow
   - `WARN`: Potential problems that don't stop execution
   - `ERROR`: Errors that affect functionality
3. **Structure additional data** - Pass structured objects rather than formatting them into strings
4. **Don't over-log** - Too many logs can be as useless as no logs
5. **Protect sensitive data** - Never log passwords, tokens, or PII
6. **Use environment variables** for production configuration
7. **Consider performance** - Disable verbose logging in production
