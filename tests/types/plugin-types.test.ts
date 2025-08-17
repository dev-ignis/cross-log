/**
 * TypeScript type tests for plugin system
 * These tests verify compile-time type safety
 */

import {
  createLogger,
  createLoggerBuilder,
  createLoggerWithPlugins,
  plugins,
  hasPlugin,
  hasPlugins,
  LoggerWithPlugins,
  PluginName,
  ILogger
} from '../../src';

// Test 1: Builder pattern provides proper type inference
function testBuilderPattern() {
  const logger = createLoggerBuilder()
    .withPlugin(plugins.api())
    .withPlugin(plugins.database())
    .build();

  // These should be type-safe with no casting needed
  logger.api.request('GET', '/api/users', 100, 200);
  logger.api.error('POST', '/api/users', new Error('Failed'), 500);
  
  logger.database.query('SELECT * FROM users', 50, 10);
  logger.database.slowQuery('SELECT * FROM large_table', 5000);
  
  // TypeScript should know these methods exist
  const hasApiPlugin: boolean = logger.hasPlugin('api');
  const hasDatabasePlugin: boolean = logger.hasPlugin('database');
  
  // @ts-expect-error - analytics plugin not loaded
  logger.analytics?.event('test', 'provider');
}

// Test 2: Configuration-based creation with type inference
function testConfigBasedCreation() {
  const logger = createLoggerWithPlugins(
    { enabled: true },
    {
      api: { includeSessionId: true },
      database: { slowQueryThreshold: 1000 },
      analytics: { providers: ['google', 'mixpanel'] }
    }
  );

  // All configured plugins should be available
  logger.api.request('GET', '/api', 100);
  logger.database.query('SELECT 1', 10);
  logger.analytics.event('page_view', 'google');
  
  // @ts-expect-error - performance plugin not configured
  logger.performance?.measure('metric', 100);
  
  // @ts-expect-error - security plugin not configured
  logger.security?.event('login', 'low');
}

// Test 3: Type guards work correctly
function testTypeGuards() {
  const logger = createLogger();
  
  // Before plugin is loaded
  if (hasPlugin(logger, 'api')) {
    // TypeScript knows api methods are available here
    logger.api.request('GET', '/test', 100);
  }
  
  // Multiple plugins check
  if (hasPlugins(logger, ['api', 'database'])) {
    // Both should be available
    logger.api.request('GET', '/test', 100);
    logger.database.query('SELECT 1', 10);
  }
}

// Test 4: Dynamic plugin loading maintains types
function testDynamicPluginLoading() {
  const logger = createLoggerBuilder().build();
  
  // Dynamically add plugins
  const loggerWithApi = logger.use(plugins.api());
  
  // @ts-expect-error - api might not be available on original logger type
  logger.api?.request('GET', '/test', 100);
  
  // But it should be available on the returned logger
  if (loggerWithApi.api) {
    loggerWithApi.api.request('GET', '/test', 100);
  }
}

// Test 5: Plugin method signatures are enforced
function testPluginMethodSignatures() {
  const logger = createLoggerBuilder()
    .withPlugin(plugins.api())
    .withPlugin(plugins.performance())
    .build();

  // Correct usage
  logger.api.request('GET', '/api', 100, 200);
  logger.api.response('/api', 200, 100);
  logger.api.error('POST', '/api', new Error('Failed'));
  
  logger.performance.measure('metric', 100);
  logger.performance.cache('hit', 'key', 50);
  logger.performance.webVitals({ fcp: 100, lcp: 200 });
  
  // @ts-expect-error - wrong parameter types
  logger.api.request(123, '/api', '100', 200);
  
  // @ts-expect-error - missing required parameters
  logger.api.request('GET');
  
  // @ts-expect-error - wrong enum value
  logger.performance.cache('invalid', 'key');
}

// Test 6: Plugin removal
function testPluginRemoval() {
  const logger = createLoggerBuilder()
    .withPlugin(plugins.api())
    .build();
  
  // API should be available
  logger.api.request('GET', '/test', 100);
  
  // Remove plugin
  logger.removePlugin('api');
  
  // API might not be available after removal
  if (logger.api) {
    logger.api.request('GET', '/test', 100);
  }
}

// Test 7: Custom plugin augmentation
declare module '../../src' {
  interface CustomPluginRegistry {
    custom: {
      config: { customOption?: string };
      methods: {
        customMethod(value: string): void;
      };
    };
  }
}

function testCustomPluginAugmentation() {
  // This would work if custom plugin is properly implemented
  // const customPlugin: TypedPlugin<'custom'> = {
  //   name: 'custom',
  //   init(context) {
  //     // Implementation
  //   }
  // };
  
  // const logger = createLoggerBuilder()
  //   .withPlugin(customPlugin)
  //   .build();
  
  // logger.custom.customMethod('test');
}

// Test 8: Type inference with partial configurations
function testPartialConfigurations() {
  const logger = createLoggerWithPlugins(
    undefined,
    {
      api: {}, // Use defaults
      database: { slowQueryThreshold: 2000 } // Override specific option
    }
  );
  
  logger.api.request('GET', '/api', 100);
  logger.database.query('SELECT 1', 10);
}

// Export to prevent unused function warnings
export {
  testBuilderPattern,
  testConfigBasedCreation,
  testTypeGuards,
  testDynamicPluginLoading,
  testPluginMethodSignatures,
  testPluginRemoval,
  testCustomPluginAugmentation,
  testPartialConfigurations
};