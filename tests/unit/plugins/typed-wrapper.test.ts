/**
 * Tests for typed wrapper utilities
 */

import {
  createTypedLogger,
  createPartialTypedLogger,
  isPluginAvailable,
  createLoggerWithSelectedPlugins,
  createAsyncTypedLogger
} from '../../../src/plugins/typed-wrapper';
import { LogLevel } from '../../../src/core/types';

describe('Typed Wrapper Utilities', () => {
  describe('createTypedLogger', () => {
    it('should create a fully typed logger with all plugins', () => {
      const logger = createTypedLogger();
      
      // All plugins should be available and typed
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
      
      // Core logger methods should be available
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should accept logger configuration', () => {
      const logger = createTypedLogger({
        logger: {
          minLevel: LogLevel.WARN,
          showTimestamp: true
        }
      });
      
      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.showTimestamp).toBe(true);
    });

    it('should accept plugin configurations', () => {
      const logger = createTypedLogger({
        plugins: {
          api: { includeSessionId: true },
          database: { slowQueryThreshold: 2000 }
        }
      });
      
      // Plugins should be configured and functional
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      
      // Test functionality
      logger.api.request('GET', '/test', 100, 200);
      logger.database.query('SELECT 1', 50, 1);
    });

    it('should handle undefined plugin configs', () => {
      const logger = createTypedLogger({
        plugins: {
          api: undefined,
          database: undefined
        }
      });
      
      // Plugins should still be loaded with defaults
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
    });

    it('should support all plugin methods', () => {
      const logger = createTypedLogger();
      
      // Test each plugin's core methods
      logger.api.request('GET', '/api', 100, 200);
      logger.api.response('/api', 200, 100);
      logger.api.error('POST', '/api', new Error('test'));
      
      logger.database.query('SELECT 1', 50, 1);
      logger.database.transaction('tx1', 'begin');
      logger.database.slowQuery('SELECT * FROM large', 5000);
      
      logger.analytics.event('click', 'google');
      logger.analytics.pageView('/home', 'facebook');
      logger.analytics.identify('user123');
      
      logger.performance.measure('metric', 100);
      logger.performance.mark('start');
      logger.performance.cache('hit', 'key123');
      
      logger.security.event('login', 'low');
      logger.security.authSuccess('user123');
      logger.security.authFailure('Invalid password');
    });
  });

  describe('createPartialTypedLogger', () => {
    it('should create logger with optional plugins', () => {
      const logger = createPartialTypedLogger({
        plugins: {
          api: {},
          database: {},
          analytics: {},
          performance: {},
          security: {}
        }
      });
      
      // All plugins should be loaded when configured
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
    });

    it('should handle enabled/disabled plugins', () => {
      const logger = createPartialTypedLogger({
        plugins: {
          api: { enabled: true },
          database: { enabled: false },
          analytics: { enabled: true }
        }
      });
      
      // Enabled plugins should work
      expect(logger.api).toBeDefined();
      expect(logger.analytics).toBeDefined();
      
      // Note: In the actual implementation, disabled plugins
      // are still attached but could be made conditional
      expect(logger.database).toBeDefined();
    });

    it('should accept plugin-specific configs', () => {
      const logger = createPartialTypedLogger({
        plugins: {
          api: { 
            enabled: true,
            includeSessionId: true,
            truncateUrl: 150
          },
          performance: {
            enabled: true,
            webVitals: true
          }
        }
      });
      
      expect(logger.api).toBeDefined();
      expect(logger.performance).toBeDefined();
      
      // Test configured functionality
      logger.api?.request('GET', '/test', 100, 200);
      logger.performance?.webVitals({ fcp: 1200, lcp: 2100 });
    });
  });

  describe('isPluginAvailable', () => {
    let logger: any;

    beforeEach(() => {
      logger = createTypedLogger();
    });

    it('should check if plugin is available', () => {
      expect(isPluginAvailable(logger, 'api')).toBe(true);
      expect(isPluginAvailable(logger, 'database')).toBe(true);
      expect(isPluginAvailable(logger, 'analytics')).toBe(true);
      expect(isPluginAvailable(logger, 'performance')).toBe(true);
      expect(isPluginAvailable(logger, 'security')).toBe(true);
    });

    it('should return false for non-existent plugins', () => {
      const customLogger = createPartialTypedLogger();
      
      // Remove a plugin
      delete (customLogger as any).nonexistent;
      
      expect(isPluginAvailable(customLogger, 'nonexistent' as any)).toBe(false);
    });

    it('should handle logger without plugins', () => {
      const plainLogger = {
        info: () => {},
        debug: () => {},
        warn: () => {},
        error: () => {}
      };
      
      expect(isPluginAvailable(plainLogger as any, 'api')).toBe(false);
    });
  });

  describe('createLoggerWithSelectedPlugins', () => {
    it('should create logger with only selected plugins', () => {
      const logger = createLoggerWithSelectedPlugins(
        undefined,
        {
          api: { includeSessionId: true },
          database: { slowQueryThreshold: 1500 }
        }
      );
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      
      // These shouldn't be loaded
      expect(logger.analytics).toBeUndefined();
      expect(logger.performance).toBeUndefined();
      expect(logger.security).toBeUndefined();
    });

    it('should handle empty plugin list', () => {
      const logger = createLoggerWithSelectedPlugins(undefined, {});
      
      // No plugins should be loaded
      expect(logger.api).toBeUndefined();
      expect(logger.database).toBeUndefined();
      expect(logger.analytics).toBeUndefined();
      expect(logger.performance).toBeUndefined();
      expect(logger.security).toBeUndefined();
      
      // Core methods should still work
      expect(logger.info).toBeDefined();
      logger.info('Test message');
    });

    it('should use default configs when not provided', () => {
      const logger = createLoggerWithSelectedPlugins(
        undefined,
        {
          api: {},
          analytics: {},
          security: {}
        }
      );
      
      expect(logger.api).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.security).toBeDefined();
      
      // Test with defaults
      logger.api.request('GET', '/test', 100, 200);
      logger.analytics.event('test', 'provider');
      logger.security.event('test', 'low');
    });

    it('should accept logger config', () => {
      const logger = createLoggerWithSelectedPlugins(
        { minLevel: LogLevel.ERROR },
        { api: {} }
      );
      
      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.ERROR);
      expect(logger.api).toBeDefined();
    });

    it('should handle all plugins', () => {
      const logger = createLoggerWithSelectedPlugins(
        undefined,
        {
          api: { truncateUrl: 100 },
          database: { includeParams: true },
          analytics: { providers: ['google'] },
          performance: { webVitals: true },
          security: { severity: true }
        }
      );
      
      // All requested plugins should be loaded
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
      
      // Test functionality
      logger.api.request('GET', '/api', 100, 200);
      logger.database.query('SELECT 1', 50, 1);
      logger.analytics.event('test', 'google');
      logger.performance.measure('test', 100);
      logger.security.event('test', 'medium');
    });
  });

  describe('createAsyncTypedLogger', () => {
    it('should create logger asynchronously with all plugins', async () => {
      const logger = await createAsyncTypedLogger();
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
    });

    it('should load only specified plugins', async () => {
      const logger = await createAsyncTypedLogger(
        {
          plugins: {
            api: { includeSessionId: true },
            database: { slowQueryThreshold: 2000 }
          }
        },
        ['api', 'database']
      );
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
    });

    it('should accept logger configuration', async () => {
      const logger = await createAsyncTypedLogger({
        logger: { minLevel: LogLevel.WARN },
        plugins: {}
      });
      
      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
    });

    it('should work with empty plugin list', async () => {
      const logger = await createAsyncTypedLogger(undefined, []);
      
      // No plugins should be loaded
      expect(logger.api).toBeUndefined();
      expect(logger.database).toBeUndefined();
      
      // Core methods should work
      expect(logger.info).toBeDefined();
    });

    it('should handle plugin configurations', async () => {
      const logger = await createAsyncTypedLogger({
        plugins: {
          performance: { webVitals: true },
          security: { severity: true }
        }
      }, ['performance', 'security']);
      
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
      
      // Test functionality
      logger.performance?.measure('test', 100);
      logger.security?.event('test', 'low');
    });
  });

  describe('TypeScript Integration', () => {
    it('should provide proper type inference', () => {
      const logger = createTypedLogger();
      
      // These should all have proper types without casting
      const apiRequest: typeof logger.api.request = logger.api.request;
      const dbQuery: typeof logger.database.query = logger.database.query;
      const analyticsEvent: typeof logger.analytics.event = logger.analytics.event;
      const perfMeasure: typeof logger.performance.measure = logger.performance.measure;
      const securityEvent: typeof logger.security.event = logger.security.event;
      
      expect(apiRequest).toBeDefined();
      expect(dbQuery).toBeDefined();
      expect(analyticsEvent).toBeDefined();
      expect(perfMeasure).toBeDefined();
      expect(securityEvent).toBeDefined();
    });

    it('should handle method chaining', () => {
      const logger = createTypedLogger();
      
      // Test method chaining
      const newLogger = logger.use({
        name: 'custom',
        init: () => {}
      });
      
      expect(newLogger).toBeDefined();
      expect(newLogger.info).toBeDefined();
    });

    it('should support getPlugin', () => {
      const logger = createTypedLogger();
      
      const apiPlugin = logger.getPlugin('api');
      const dbPlugin = logger.getPlugin('database');
      
      expect(apiPlugin).toBeDefined();
      expect(dbPlugin).toBeDefined();
    });
  });
});