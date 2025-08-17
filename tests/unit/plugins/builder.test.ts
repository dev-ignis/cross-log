/**
 * Tests for the TypeScript builder pattern and related utilities
 */

import {
  createLoggerBuilder,
  createLoggerWithPlugins,
  wrapLogger,
  hasPlugin,
  hasPlugins,
  plugins
} from '../../../src/plugins';
import { LogLevel } from '../../../src/core/types';

describe('Plugin Builder System', () => {
  describe('createLoggerBuilder', () => {
    it('should create a logger with no plugins', () => {
      const logger = createLoggerBuilder().build();
      
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should create a logger with custom config', () => {
      const logger = createLoggerBuilder({
        minLevel: LogLevel.WARN,
        showTimestamp: true
      }).build();
      
      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.showTimestamp).toBe(true);
    });

    it('should add a single plugin', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .build();
      
      expect(logger.api).toBeDefined();
      expect(logger.api?.request).toBeDefined();
      expect(logger.api?.response).toBeDefined();
      expect(logger.api?.error).toBeDefined();
    });

    it('should chain multiple plugins', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .withPlugin(plugins.database())
        .withPlugin(plugins.analytics())
        .build();
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
    });

    it('should pass plugin configurations', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.api({
          includeSessionId: true,
          truncateUrl: 100
        }))
        .withPlugin(plugins.database({
          slowQueryThreshold: 2000
        }))
        .build();
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      
      // Verify plugins are functional
      logger.api?.request('GET', '/test', 100, 200);
      logger.database?.query('SELECT 1', 50, 1);
    });

    it('should support dynamic plugin addition after build', () => {
      const logger = createLoggerBuilder().build();
      
      expect(logger.performance).toBeUndefined();
      
      logger.use(plugins.performance());
      
      expect(logger.performance).toBeDefined();
      expect(logger.performance?.measure).toBeDefined();
    });

    it('should support plugin removal', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .build();
      
      expect(logger.api).toBeDefined();
      expect(logger.hasPlugin('api')).toBe(true);
      
      logger.removePlugin('api');
      
      expect(logger.api).toBeUndefined();
      expect(logger.hasPlugin('api')).toBe(false);
    });

    it('should retrieve plugin instance', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.security())
        .build();
      
      const plugin = logger.getPlugin('security');
      
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('security');
    });
  });

  describe('createLoggerWithPlugins', () => {
    it('should create logger with no plugins when config is empty', () => {
      const logger = createLoggerWithPlugins();
      
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
    });

    it('should create logger with specified plugins', () => {
      const logger = createLoggerWithPlugins(
        { minLevel: LogLevel.INFO },
        {
          api: { includeSessionId: false },
          database: { slowQueryThreshold: 1000 }
        }
      );
      
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeUndefined();
    });

    it('should handle partial plugin configs', () => {
      const logger = createLoggerWithPlugins(
        undefined,
        {
          api: {},
          performance: { webVitals: true }
        }
      );
      
      expect(logger.api).toBeDefined();
      expect(logger.performance).toBeDefined();
      
      // Test functionality
      logger.api?.request('POST', '/api', 150, 201);
      logger.performance?.measure('test', 100);
    });

    it('should combine logger config and plugin configs', () => {
      const logger = createLoggerWithPlugins(
        {
          showTimestamp: true,
          minLevel: LogLevel.DEBUG
        },
        {
          analytics: { providers: ['google'] },
          security: { severity: true }
        }
      );
      
      const config = logger.getConfig();
      expect(config.showTimestamp).toBe(true);
      expect(config.minLevel).toBe(LogLevel.DEBUG);
      expect(logger.analytics).toBeDefined();
      expect(logger.security).toBeDefined();
    });
  });

  describe('wrapLogger', () => {
    it('should wrap existing logger with type information', () => {
      const baseLogger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .withPlugin(plugins.database())
        .build();
      
      const wrappedLogger = wrapLogger(baseLogger, ['api', 'database']);
      
      expect(wrappedLogger).toBe(baseLogger);
      expect(wrappedLogger.api).toBeDefined();
      expect(wrappedLogger.database).toBeDefined();
    });

    it('should work with empty plugin list', () => {
      const baseLogger = createLoggerBuilder().build();
      const wrappedLogger = wrapLogger(baseLogger, []);
      
      expect(wrappedLogger).toBe(baseLogger);
      expect(wrappedLogger.info).toBeDefined();
    });
  });

  describe('hasPlugin', () => {
    let logger: any;

    beforeEach(() => {
      logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .withPlugin(plugins.database())
        .build();
    });

    it('should return true for loaded plugins', () => {
      expect(hasPlugin(logger, 'api')).toBe(true);
      expect(hasPlugin(logger, 'database')).toBe(true);
    });

    it('should return false for not loaded plugins', () => {
      expect(hasPlugin(logger, 'analytics')).toBe(false);
      expect(hasPlugin(logger, 'performance')).toBe(false);
      expect(hasPlugin(logger, 'security')).toBe(false);
    });

    it('should work as type guard', () => {
      if (hasPlugin(logger, 'api')) {
        // TypeScript should know api is available
        expect(logger.api?.request).toBeDefined();
        logger.api?.request('GET', '/test', 100, 200);
      }
    });
  });

  describe('hasPlugins', () => {
    let logger: any;

    beforeEach(() => {
      logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .withPlugin(plugins.database())
        .withPlugin(plugins.analytics())
        .build();
    });

    it('should return true when all plugins are loaded', () => {
      expect(hasPlugins(logger, ['api', 'database'])).toBe(true);
      expect(hasPlugins(logger, ['api', 'database', 'analytics'])).toBe(true);
    });

    it('should return false when any plugin is missing', () => {
      expect(hasPlugins(logger, ['api', 'performance'])).toBe(false);
      expect(hasPlugins(logger, ['api', 'database', 'security'])).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(hasPlugins(logger, [])).toBe(true);
    });

    it('should work as type guard for multiple plugins', () => {
      if (hasPlugins(logger, ['api', 'database', 'analytics'])) {
        // TypeScript should know all three are available
        expect(logger.api?.request).toBeDefined();
        expect(logger.database?.query).toBeDefined();
        expect(logger.analytics?.event).toBeDefined();
        
        logger.api?.request('GET', '/test', 100, 200);
        logger.database?.query('SELECT 1', 50, 1);
        logger.analytics?.event('test', 'google');
      }
    });
  });

  describe('Plugin Integration', () => {
    it('should handle all plugins together', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.api())
        .withPlugin(plugins.database())
        .withPlugin(plugins.analytics())
        .withPlugin(plugins.performance())
        .withPlugin(plugins.security())
        .build();
      
      // All plugins should be available
      expect(logger.api).toBeDefined();
      expect(logger.database).toBeDefined();
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
      
      // Test each plugin's functionality
      logger.api?.request('GET', '/api/users', 120, 200);
      logger.database?.query('SELECT * FROM users', 45, 10);
      logger.analytics?.event('PageView', 'google');
      logger.performance?.measure('api_call', 450);
      logger.security?.event('login_attempt', 'low');
    });

    it('should maintain plugin state across operations', () => {
      const logger = createLoggerBuilder()
        .withPlugin(plugins.performance())
        .build();
      
      // Mark a performance point
      logger.performance?.mark('start');
      
      // Add another plugin
      logger.use(plugins.api());
      
      // Original plugin should still work
      logger.performance?.mark('end');
      logger.performance?.measure('duration', 150);
      
      // New plugin should work
      logger.api?.request('GET', '/test', 100, 200);
    });
  });
});