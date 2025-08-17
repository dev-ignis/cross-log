# TypeScript Plugin System Documentation

The cross-log plugin system now provides comprehensive TypeScript support with full type safety, eliminating the need for type casting and providing excellent IDE autocomplete.

## Table of Contents
- [Quick Start](#quick-start)
- [Builder Pattern](#builder-pattern)
- [Configuration-Based Creation](#configuration-based-creation)
- [Type Guards](#type-guards)
- [Module Augmentation](#module-augmentation)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)

## Quick Start

### Installation
```bash
npm install cross-log
```

### Basic Usage with Full Type Safety
```typescript
import { createLoggerBuilder, plugins } from 'cross-log';

// Create logger with plugins using builder pattern
const logger = createLoggerBuilder()
  .withPlugin(plugins.api())
  .withPlugin(plugins.database())
  .build();

// All methods are fully typed - no casting needed!
logger.api.request('GET', '/api/users', 100, 200);
logger.database.query('SELECT * FROM users', 50, 10);
```

## Builder Pattern

The builder pattern provides the best type inference and IDE support:

```typescript
import { createLoggerBuilder, plugins } from 'cross-log';

const logger = createLoggerBuilder({ 
  enabled: true,
  minLevel: LogLevel.INFO 
})
  .withPlugin(plugins.api({ 
    includeSessionId: true,
    truncateUrl: 100 
  }))
  .withPlugin(plugins.database({ 
    slowQueryThreshold: 1000 
  }))
  .withPlugin(plugins.analytics({
    providers: ['google', 'mixpanel']
  }))
  .build();

// TypeScript knows exactly which plugins are available
logger.api.request('GET', '/api', 100, 200);
logger.api.error('POST', '/api', new Error('Failed'), 500);

logger.database.query('SELECT * FROM users', 50);
logger.database.slowQuery('SELECT * FROM large_table', 5000);

logger.analytics.event('button_click', 'google', { button: 'submit' });
logger.analytics.pageView('/home', 'mixpanel');

// TypeScript will error if you try to use a plugin that wasn't loaded
// @ts-expect-error - performance plugin not loaded
logger.performance?.measure('metric', 100); // ❌ TypeScript error
```

## Configuration-Based Creation

For simpler setups, use the configuration-based approach:

```typescript
import { createLoggerWithPlugins } from 'cross-log';

const logger = createLoggerWithPlugins(
  { 
    enabled: true,
    showTimestamp: true 
  },
  {
    api: { 
      includeSessionId: true,
      includeHeaders: false 
    },
    database: { 
      slowQueryThreshold: 1000,
      includeParams: true 
    },
    analytics: { 
      providers: ['google'] 
    }
  }
);

// All configured plugins are available with full type safety
logger.api.request('GET', '/api/data', 150, 200);
logger.database.query('INSERT INTO logs', 25, 1);
logger.analytics.event('page_view', 'google');

// Unconfigured plugins are not available
// @ts-expect-error
logger.security?.event('login', 'low'); // ❌ TypeScript error
```

## Type Guards

Use type guards to safely check for plugin availability:

```typescript
import { createLogger, plugins, hasPlugin, hasPlugins } from 'cross-log';

const logger = createLogger();

// Single plugin check
if (hasPlugin(logger, 'api')) {
  // TypeScript knows api is available in this block
  logger.api.request('GET', '/test', 100);
  logger.api.response('/test', 200, 100);
}

// Multiple plugins check
if (hasPlugins(logger, ['api', 'database', 'analytics'])) {
  // All three plugins are guaranteed to be available
  logger.api.request('GET', '/api', 100);
  logger.database.query('SELECT 1', 10);
  logger.analytics.event('test', 'provider');
}

// Runtime plugin checking
function processWithLogging(logger: ILogger) {
  if (hasPlugin(logger, 'performance')) {
    logger.performance.measure('process_time', 150);
    logger.performance.cache('hit', 'user_123', 5);
  }
  
  // Regular logging always available
  logger.info('Processing completed');
}
```

## Module Augmentation

Extend the plugin system with your own custom plugins:

### Step 1: Define Your Plugin Types
```typescript
// my-plugin.ts
import { Plugin, PluginContext } from 'cross-log';

export interface MyCustomPluginConfig {
  enabled?: boolean;
  customOption?: string;
  threshold?: number;
}

export interface MyCustomPluginMethods {
  track(event: string, data?: any): void;
  measure(metric: string, value: number): void;
  report(summary: any): void;
}

export class MyCustomPlugin implements Plugin<MyCustomPluginConfig> {
  name = 'myCustom' as const;
  config: MyCustomPluginConfig;
  
  constructor(config?: MyCustomPluginConfig) {
    this.config = { enabled: true, threshold: 100, ...config };
  }
  
  init(context: PluginContext): void {
    const methods: MyCustomPluginMethods = {
      track: (event, data) => {
        context.logger.info(`Custom track: ${event}`, 'MyCustom', data);
      },
      measure: (metric, value) => {
        if (value > (this.config.threshold || 100)) {
          context.logger.warn(`High value for ${metric}: ${value}`, 'MyCustom');
        }
      },
      report: (summary) => {
        context.logger.info('Custom report', 'MyCustom', summary);
      }
    };
    
    (context as any).methods = methods;
  }
}
```

### Step 2: Augment the Type Definitions
```typescript
// types.d.ts or in your plugin file
declare module 'cross-log' {
  interface CustomPluginRegistry {
    myCustom: {
      config: MyCustomPluginConfig;
      methods: MyCustomPluginMethods;
    };
  }
}
```

### Step 3: Use Your Custom Plugin
```typescript
import { createLoggerBuilder } from 'cross-log';
import { MyCustomPlugin } from './my-plugin';

const logger = createLoggerBuilder()
  .withPlugin(new MyCustomPlugin({ threshold: 200 }))
  .build();

// Your custom plugin is now fully typed!
logger.myCustom.track('user_action', { userId: 123 });
logger.myCustom.measure('response_time', 250);
logger.myCustom.report({ total: 100, success: 95 });
```

## API Reference

### Types

#### `LoggerWithPlugins<P>`
A logger instance with specific plugins loaded. The generic parameter `P` is an array of plugin names.

```typescript
type LoggerWithPlugins<P extends PluginName[]>
```

#### `PluginName`
Union type of all available plugin names.

```typescript
type PluginName = 'api' | 'database' | 'analytics' | 'performance' | 'security'
```

#### `PluginRegistry`
Registry mapping plugin names to their configurations and method types.

```typescript
interface PluginRegistry {
  api: { config: ApiPluginConfig; methods: ApiPlugin };
  database: { config: DatabasePluginConfig; methods: DatabasePlugin };
  // ... etc
}
```

#### `TypedPlugin<T>`
Type-safe plugin instance with proper typing.

```typescript
interface TypedPlugin<T extends PluginName> extends Plugin<PluginConfigType<T>> {
  name: T;
  methods?: PluginMethods<T>;
}
```

### Functions

#### `createLoggerBuilder(config?)`
Creates a new logger builder for chaining plugins.

```typescript
function createLoggerBuilder(config?: PartialLoggerConfig): LoggerBuilder
```

#### `createLoggerWithPlugins(loggerConfig?, pluginConfigs?)`
Creates a logger with plugins using configuration objects.

```typescript
function createLoggerWithPlugins<T extends LoggerWithPluginsConfig>(
  loggerConfig?: PartialLoggerConfig,
  pluginConfigs?: T
): ConfiguredLogger<T>
```

#### `hasPlugin(logger, pluginName)`
Type guard to check if a logger has a specific plugin.

```typescript
function hasPlugin<T extends PluginName>(
  logger: ILogger,
  pluginName: T
): logger is ILogger & Record<T, PluginMethods<T>>
```

#### `hasPlugins(logger, pluginNames)`
Type guard to check if a logger has multiple plugins.

```typescript
function hasPlugins<P extends PluginName[]>(
  logger: ILogger,
  pluginNames: P
): logger is LoggerWithPlugins<P>
```

## Migration Guide

### From Old Pattern (Type Casting Required)
```typescript
// ❌ Old way - requires type casting
const logger = createLogger(config) as any;
logger.use(plugins.api());
logger.use(plugins.database());

// Need to cast to access methods
(logger as any).api.request('GET', '/api', 100);
```

### To New Pattern (Fully Typed)
```typescript
// ✅ New way - fully typed
const logger = createLoggerBuilder(config)
  .withPlugin(plugins.api())
  .withPlugin(plugins.database())
  .build();

// No casting needed!
logger.api.request('GET', '/api', 100);
logger.database.query('SELECT 1', 10);
```

### Using the Wrapper for Existing Code
If you have existing code with plugins already loaded:

```typescript
import { wrapLogger } from 'cross-log';

// Existing logger with unknown type
const existingLogger = getLoggerFromSomewhere();

// Wrap it with type information
const typedLogger = wrapLogger(existingLogger, ['api', 'database']);

// Now you have full type safety
typedLogger.api.request('GET', '/api', 100);
typedLogger.database.query('SELECT 1', 10);
```

## Best Practices

1. **Use the Builder Pattern**: Provides the best type inference and IDE support.

2. **Configure All Plugins Upfront**: When possible, configure all plugins at logger creation time for better type safety.

3. **Use Type Guards for Dynamic Access**: When you need to check plugin availability at runtime, use the provided type guards.

4. **Leverage Module Augmentation**: For custom plugins, properly augment the types for seamless integration.

5. **Avoid Type Casting**: The new system eliminates the need for type casting - if you find yourself casting, there's likely a better approach.

## Examples

### Real-World API Client
```typescript
import { createLoggerBuilder, plugins } from 'cross-log';

class ApiClient {
  private logger = createLoggerBuilder()
    .withPlugin(plugins.api({
      includeSessionId: true,
      truncateUrl: 150
    }))
    .withPlugin(plugins.performance())
    .build();

  async fetch(url: string): Promise<Response> {
    const start = performance.now();
    
    try {
      this.logger.api.request('GET', url);
      const response = await fetch(url);
      const duration = performance.now() - start;
      
      this.logger.api.response(url, response.status, duration);
      this.logger.performance.measure('api_call', duration);
      
      if (duration > 1000) {
        this.logger.performance.cache('miss', url, duration);
      }
      
      return response;
    } catch (error) {
      this.logger.api.error('GET', url, error as Error);
      throw error;
    }
  }
}
```

### Database Query Logger
```typescript
import { createLoggerWithPlugins } from 'cross-log';

class Database {
  private logger = createLoggerWithPlugins(
    { showTimestamp: true },
    {
      database: {
        slowQueryThreshold: 1000,
        includeParams: true
      },
      performance: {}
    }
  );

  async query<T>(sql: string, params?: any[]): Promise<T> {
    const start = performance.now();
    
    try {
      this.logger.database.transaction('tx_001', 'begin');
      const result = await this.executeQuery<T>(sql, params);
      const duration = performance.now() - start;
      
      this.logger.database.query(sql, duration, result.length, params);
      
      if (duration > 1000) {
        this.logger.database.slowQuery(sql, duration, params);
      }
      
      this.logger.database.transaction('tx_001', 'commit', duration);
      this.logger.performance.measure('db_query', duration);
      
      return result;
    } catch (error) {
      this.logger.database.error(sql, error as Error, params);
      this.logger.database.transaction('tx_001', 'rollback');
      throw error;
    }
  }
  
  private async executeQuery<T>(sql: string, params?: any[]): Promise<T> {
    // Actual database query implementation
    return [] as any;
  }
}
```

## Troubleshooting

### TypeScript doesn't recognize plugin methods
Make sure you're importing from the main package entry:
```typescript
import { createLoggerBuilder, plugins } from 'cross-log';
// NOT from 'cross-log/plugins'
```

### Custom plugins not getting typed
Ensure your module augmentation is in a `.d.ts` file or has the proper declare module statement.

### Type errors when chaining plugins
The builder pattern requires each `withPlugin` call to be chained. Don't break the chain:
```typescript
// ✅ Correct
const logger = createLoggerBuilder()
  .withPlugin(plugins.api())
  .withPlugin(plugins.database())
  .build();

// ❌ Incorrect
const builder = createLoggerBuilder();
builder.withPlugin(plugins.api());
builder.withPlugin(plugins.database());
const logger = builder.build(); // Type information lost
```

## Support

For issues or questions about the TypeScript plugin system, please visit:
https://github.com/dev-ignis/cross-log/issues