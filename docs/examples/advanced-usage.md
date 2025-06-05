# Advanced Usage Guide

This guide covers advanced patterns and configurations for Universal Logger.

## Custom Logger Configuration

### Full Configuration Example

```typescript
import { createLogger, LogLevel } from 'cross-log';

const logger = createLogger({
  // Core settings
  minLevel: LogLevel.INFO,
  enabled: true,
  
  // Features
  showTimestamp: true,
  includeStackTrace: true,
  
  // Color configuration
  colors: {
    enabled: true,
    browser: {
      debug: '#8A2BE2', // Custom colors for browser
      info: '#228B22',
      warn: '#FF8C00',
      error: '#FF0000'
    },
    node: {
      debug: 35, // Magenta in ANSI
      info: 32,  // Green in ANSI
      warn: 33,  // Yellow in ANSI
      error: 31  // Red in ANSI
    }
  },
  
  // Browser storage
  storage: {
    enabled: true,
    keyPrefix: 'myapp_logger'
  },
  
  // Browser console helpers
  browserControls: {
    enabled: true,
    windowNamespace: '__myAppLogger'
  }
});
```

## Advanced Category Management

### Category Hierarchies

You can implement hierarchical category management:

```typescript
// Create a helper function for hierarchical categories
function enableCategoryHierarchy(rootCategory, level = LogLevel.DEBUG) {
  logger.enableCategory(rootCategory, level);
  
  // You could list known sub-categories here
  const subCategories = [
    `${rootCategory}.events`,
    `${rootCategory}.state`,
    `${rootCategory}.api`,
  ];
  
  // Enable all sub-categories with the same level
  subCategories.forEach(cat => logger.enableCategory(cat, level));
}

// Usage
enableCategoryHierarchy('users');
logger.info('User profile updated', 'users.state');
```

### Dynamic Category Filtering

```typescript
// Create a dynamic category filter
function setupDynamicLogging() {
  // For example, enable more detailed logs for a specific user session
  const userId = getCurrentUser()?.id;
  
  if (userId === 'admin123') {
    // Enable verbose logging for admins
    logger.setLevel(LogLevel.DEBUG);
    logger.enableCategory('security', LogLevel.DEBUG);
    logger.enableCategory('performance', LogLevel.DEBUG);
  } else {
    // Standard logging for regular users
    logger.setLevel(LogLevel.INFO);
    logger.disableCategory('performance');
  }
}
```

## Integration Patterns

### Singleton Pattern

For consistent logging across your application:

```typescript
// logger.ts
import { createLogger, LogLevel, LoggerConfig } from 'cross-log';

class LoggerService {
  private static instance: LoggerService;
  private logger;
  
  private constructor() {
    const config: LoggerConfig = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
      // ... other configuration
    };
    
    this.logger = createLogger(config);
  }
  
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }
  
  public debug(message: string, category?: string, ...args: any[]): void {
    this.logger.debug(message, category, ...args);
  }
  
  public info(message: string, category?: string, ...args: any[]): void {
    this.logger.info(message, category, ...args);
  }
  
  public warn(message: string, category?: string, ...args: any[]): void {
    this.logger.warn(message, category, ...args);
  }
  
  public error(message: string | Error, category?: string, ...args: any[]): void {
    this.logger.error(message, category, ...args);
  }
  
  // Add other methods as needed
}

// Export a singleton instance
export const loggerService = LoggerService.getInstance();
```

### Dependency Injection (Angular example)

```typescript
// logger.service.ts
import { Injectable } from '@angular/core';
import { createLogger, LogLevel } from 'cross-log';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logger;
  
  constructor() {
    this.logger = createLogger({
      minLevel: LogLevel.INFO,
      // Other config
    });
  }
  
  debug(message: string, category?: string, ...args: any[]): void {
    this.logger.debug(message, category, ...args);
  }
  
  // Other methods...
}

// usage
@Component({...})
export class AppComponent {
  constructor(private logger: LoggerService) {
    this.logger.info('Component initialized', 'ui');
  }
}
```

## Performance Optimizations

### Conditional Logging Logic

```typescript
import { LogLevel } from 'cross-log';

// Avoid expensive computations when logging is disabled
function logComplexData(data, category) {
  // Check if debug logging is enabled before doing expensive work
  if (logger.isCategoryEnabled(category) && logger.getConfig().minLevel <= LogLevel.DEBUG) {
    // Only perform expensive formatting when needed
    const formattedData = JSON.stringify(data, null, 2);
    logger.debug(`Complex data: ${formattedData}`, category);
  }
}

// Usage
function processData(hugeDataSet) {
  // ... processing logic ...
  logComplexData(hugeDataSet, 'data-processing');
}
```

### Custom Transports

You can implement custom log transports:

```typescript
// Create a function that logs to a custom endpoint
function setupRemoteLogging() {
  // Store original error method
  const originalErrorMethod = logger.error;
  
  // Override error method to also send to remote service
  logger.error = function(message, category, ...args) {
    // Call original method first
    originalErrorMethod.call(logger, message, category, ...args);
    
    // Also send to remote service
    const errorDetails = {
      message: message instanceof Error ? message.message : message,
      stack: message instanceof Error ? message.stack : null,
      category,
      timestamp: new Date().toISOString(),
      additionalData: args
    };
    
    // Send to remote error tracking
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorDetails)
    }).catch(e => {
      // Don't use logger here to avoid infinite loop
      console.error('Failed to send error to remote service', e);
    });
  };
}
```

## Testing with Universal Logger

### Mocking the Logger

```typescript
import { createLogger, LogLevel } from 'cross-log';

// Create a test logger with spies
function createTestLogger() {
  const logger = createLogger({
    minLevel: LogLevel.DEBUG
  });
  
  // Create spies for each method
  const spies = {
    debug: jest.spyOn(logger, 'debug'),
    info: jest.spyOn(logger, 'info'),
    warn: jest.spyOn(logger, 'warn'),
    error: jest.spyOn(logger, 'error')
  };
  
  return { logger, spies };
}

// Usage in tests
test('should log authentication failure', () => {
  // Setup
  const { logger, spies } = createTestLogger();
  const authService = new AuthService(logger);
  
  // Execute
  authService.login('user', 'wrong-password');
  
  // Assert
  expect(spies.warn).toHaveBeenCalledWith(
    'Authentication failed', 
    'auth',
    expect.objectContaining({ username: 'user' })
  );
});
```

## Environment Variables Pattern

For more sophisticated environment variable mapping:

```typescript
// config.ts
import { LogLevel, LoggerConfig } from 'cross-log';

function parseLogLevel(value: string | undefined): LogLevel {
  switch (value?.toUpperCase()) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'SILENT': return LogLevel.SILENT;
    default: return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  }
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export function loadConfigFromEnv(): LoggerConfig {
  return {
    minLevel: parseLogLevel(process.env.LOG_LEVEL),
    enabled: parseBoolean(process.env.LOGGER_ENABLED, true),
    showTimestamp: parseBoolean(process.env.LOGGER_TIMESTAMPS, true),
    includeStackTrace: parseBoolean(process.env.LOGGER_STACK_TRACES, true),
    // ... other config mappings
  };
}
```

## Security Best Practices

- **Never log sensitive data**: Implement data scrubbing
- **Implement rate limiting**: Prevent log flooding
- **Use structured logging**: Easier to parse and analyze
- **Consider log rotation**: For file-based logs in Node.js
- **Manage log levels carefully**: Minimize verbose logs in production
