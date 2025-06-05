/**
 * Integration tests for cross-environment compatibility
 */

import { createLogger, LogLevel } from '../../src/index';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

describe('Cross-Environment Integration', () => {
  const originalConsole = global.console;
  const originalWindow = global.window;
  const originalProcess = global.process;

  beforeEach(() => {
    global.console = mockConsole as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
    global.window = originalWindow;
    global.process = originalProcess;
  });

  describe('universal API consistency', () => {
    test('same API works in both environments', () => {
      // Test in browser environment
      global.window = { localStorage: {} } as any;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;

      const browserLogger = createLogger({ showTimestamp: false });

      // Test in Node.js environment
      delete (global as any).window;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
      
      const nodeLogger = createLogger({ showTimestamp: false });

      // Both should have identical API
      expect(typeof browserLogger.debug).toBe('function');
      expect(typeof browserLogger.info).toBe('function');
      expect(typeof browserLogger.warn).toBe('function');
      expect(typeof browserLogger.error).toBe('function');
      expect(typeof browserLogger.setLevel).toBe('function');
      expect(typeof browserLogger.configure).toBe('function');
      expect(typeof browserLogger.enableCategory).toBe('function');
      expect(typeof browserLogger.disableCategory).toBe('function');

      expect(typeof nodeLogger.debug).toBe('function');
      expect(typeof nodeLogger.info).toBe('function');
      expect(typeof nodeLogger.warn).toBe('function');
      expect(typeof nodeLogger.error).toBe('function');
      expect(typeof nodeLogger.setLevel).toBe('function');
      expect(typeof nodeLogger.configure).toBe('function');
      expect(typeof nodeLogger.enableCategory).toBe('function');
      expect(typeof nodeLogger.disableCategory).toBe('function');

      // Both should support the same configuration options
      browserLogger.setLevel(LogLevel.WARN);
      nodeLogger.setLevel(LogLevel.WARN);

      browserLogger.enableCategory('test', LogLevel.DEBUG);
      nodeLogger.enableCategory('test', LogLevel.DEBUG);

      expect(browserLogger.getConfig().minLevel).toBe(LogLevel.WARN);
      expect(nodeLogger.getConfig().minLevel).toBe(LogLevel.WARN);

      expect(browserLogger.getConfig().categories['test']).toEqual({
        enabled: true,
        minLevel: LogLevel.DEBUG
      });
      expect(nodeLogger.getConfig().categories['test']).toEqual({
        enabled: true,
        minLevel: LogLevel.DEBUG
      });
    });

    test('identical logging behavior across environments', () => {
      const configs = [
        { showTimestamp: false, minLevel: LogLevel.DEBUG },
        { showTimestamp: false, minLevel: LogLevel.WARN },
        { showTimestamp: false, enabled: false }
      ];

      configs.forEach((config) => {
        jest.clearAllMocks();

        // Browser environment
        global.window = { localStorage: {} } as any;
        global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
        const browserLogger = createLogger(config);

        browserLogger.debug('Debug message');
        browserLogger.info('Info message');
        browserLogger.warn('Warning message');
        browserLogger.error('Error message');

        const browserCalls = {
          debug: mockConsole.debug.mock.calls.length,
          info: mockConsole.info.mock.calls.length,
          warn: mockConsole.warn.mock.calls.length,
          error: mockConsole.error.mock.calls.length
        };

        jest.clearAllMocks();

        // Node.js environment
        delete (global as any).window;
        global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
        const nodeLogger = createLogger(config);

        nodeLogger.debug('Debug message');
        nodeLogger.info('Info message');
        nodeLogger.warn('Warning message');
        nodeLogger.error('Error message');

        const nodeCalls = {
          debug: mockConsole.debug.mock.calls.length,
          info: mockConsole.info.mock.calls.length,
          warn: mockConsole.warn.mock.calls.length,
          error: mockConsole.error.mock.calls.length
        };

        expect(browserCalls).toEqual(nodeCalls);
      });
    });
  });

  describe('configuration portability', () => {
    test('same configuration works in both environments', () => {
      const sharedConfig = {
        minLevel: LogLevel.WARN,
        showTimestamp: true,
        includeStackTrace: false,
        categories: {
          'api': { enabled: true, minLevel: LogLevel.DEBUG },
          'ui': { enabled: false, minLevel: LogLevel.INFO }
        }
      };

      // Browser
      global.window = { localStorage: {} } as any;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
      const browserLogger = createLogger(sharedConfig);

      // Node.js
      delete (global as any).window;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
      const nodeLogger = createLogger(sharedConfig);

      const browserConfig = browserLogger.getConfig();
      const nodeConfig = nodeLogger.getConfig();

      expect(browserConfig.minLevel).toBe(nodeConfig.minLevel);
      expect(browserConfig.showTimestamp).toBe(nodeConfig.showTimestamp);
      expect(browserConfig.includeStackTrace).toBe(nodeConfig.includeStackTrace);
      expect(browserConfig.categories).toEqual(nodeConfig.categories);
    });

    test('environment-specific defaults are respected', () => {
      // Browser environment
      global.window = { localStorage: {} } as any;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
      const browserLogger = createLogger();
      const browserConfig = browserLogger.getConfig();

      // Node.js environment
      delete (global as any).window;
      global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;
      const nodeLogger = createLogger();
      const nodeConfig = nodeLogger.getConfig();

      // Browser-specific features should be enabled in browser
      expect(browserConfig.storage.enabled).toBe(true);
      expect(browserConfig.browserControls.enabled).toBe(true);

      // Browser-specific features should be disabled in Node.js
      expect(nodeConfig.storage.enabled).toBe(false);
      expect(nodeConfig.browserControls.enabled).toBe(false);

      // Common features should have same defaults
      expect(browserConfig.enabled).toBe(nodeConfig.enabled);
      expect(browserConfig.minLevel).toBe(nodeConfig.minLevel);
      expect(browserConfig.showTimestamp).toBe(nodeConfig.showTimestamp);
    });
  });

  describe('environment variable handling', () => {
    test('same environment variables work in both environments', () => {
      const testEnv = {
        NODE_ENV: 'production',
        LOG_LEVEL: 'ERROR',
        LOGGER_ENABLED: 'false',
        LOGGER_COLORS: 'false',
        LOGGER_TIMESTAMPS: 'false'
      };

      // Browser environment
      global.window = { localStorage: {} } as any;
      global.process = { env: testEnv, cwd: () => '/test' } as any;
      const browserLogger = createLogger();
      const browserConfig = browserLogger.getConfig();

      // Node.js environment
      delete (global as any).window;
      global.process = { env: testEnv, cwd: () => '/test' } as any;
      const nodeLogger = createLogger();
      const nodeConfig = nodeLogger.getConfig();

      expect(browserConfig.minLevel).toBe(LogLevel.ERROR);
      expect(nodeConfig.minLevel).toBe(LogLevel.ERROR);
      expect(browserConfig.enabled).toBe(false);
      expect(nodeConfig.enabled).toBe(false);
      expect(browserConfig.colors.enabled).toBe(false);
      expect(nodeConfig.colors.enabled).toBe(false);
      expect(browserConfig.showTimestamp).toBe(false);
      expect(nodeConfig.showTimestamp).toBe(false);
    });
  });

  describe('drop-in replacement scenarios', () => {
    test('can replace console.log in both environments', () => {
      const environments = [
        // Browser
        { window: { localStorage: {} }, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } },
        // Node.js
        { window: undefined, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } }
      ];

      environments.forEach((env) => {
        jest.clearAllMocks();

        if (env.window) {
          global.window = env.window as any;
        } else {
          delete (global as any).window;
        }
        global.process = env.process as any;

        const logger = createLogger({ showTimestamp: false });

        // Replace console methods
        const originalLog = console.log;
        const originalError = console.error;

        console.log = logger.info.bind(logger);
        console.error = logger.error.bind(logger);

        console.log('Replaced log message');
        console.error('Replaced error message');

        console.log = originalLog;
        console.error = originalError;

        // Check if we're in browser environment (has window) or Node.js
        if (env.window) {
          // Browser environment - expect styled output
          expect(mockConsole.info).toHaveBeenCalledWith(
            '%cReplaced log message',
            'color: #4A9FCA; font-weight: bold'
          );
          expect(mockConsole.error).toHaveBeenCalledWith(
            '%cReplaced error message',
            'color: #D67C2A; font-weight: bold'
          );
        } else {
          // Node.js environment - expect ANSI colored output
          expect(mockConsole.info).toHaveBeenCalledWith(
            expect.stringContaining('Replaced log message')
          );
          expect(mockConsole.error).toHaveBeenCalledWith(
            expect.stringContaining('Replaced error message')
          );
        }
      });
    });

    test('works with existing logging patterns', () => {
      const testPatterns = [
        () => {
          const logger = createLogger({ showTimestamp: false });
          logger.info('Simple message');
        },
        () => {
          const logger = createLogger({ showTimestamp: false });
          logger.error('Error with context', undefined, { userId: 123, action: 'login' });
        },
        () => {
          const logger = createLogger({ showTimestamp: false });
          logger.debug('Debug with category', 'database');
        }
      ];

      const environments = [
        { window: { localStorage: {} }, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } },
        { window: undefined, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } }
      ];

      environments.forEach(env => {
        testPatterns.forEach(pattern => {
          jest.clearAllMocks();

          if (env.window) {
            global.window = env.window as any;
          } else {
            delete (global as any).window;
          }
          global.process = env.process as any;

          expect(() => pattern()).not.toThrow();
        });
      });
    });
  });

  describe('TypeScript compatibility', () => {
    test('maintains type safety across environments', () => {
      const environments = [
        { window: { localStorage: {} }, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } },
        { window: undefined, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } }
      ];

      environments.forEach(env => {
        if (env.window) {
          global.window = env.window as any;
        } else {
          delete (global as any).window;
        }
        global.process = env.process as any;

        const logger = createLogger();

        // TypeScript should enforce correct types
        logger.setLevel(LogLevel.WARN);
        logger.enableCategory('test', LogLevel.DEBUG);
        
        const config = logger.getConfig();
        expect(typeof config.enabled).toBe('boolean');
        expect(typeof config.minLevel).toBe('number');
        expect(typeof config.showTimestamp).toBe('boolean');

        // Level enum should be accessible
        expect(logger.Level.DEBUG).toBe(LogLevel.DEBUG);
        expect(logger.Level.INFO).toBe(LogLevel.INFO);
      });
    });
  });

  describe('error handling consistency', () => {
    test('handles errors consistently across environments', () => {
      const environments = [
        { window: { localStorage: {} }, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } },
        { window: undefined, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } }
      ];

      environments.forEach(env => {
        jest.clearAllMocks();

        if (env.window) {
          global.window = env.window as any;
        } else {
          delete (global as any).window;
        }
        global.process = env.process as any;

        const logger = createLogger({ showTimestamp: false });

        const error = new Error('Test error');
        error.stack = 'Error: Test error\n    at test.js:1:1';

        logger.error(error);

        // Check if we're in browser environment (has window) or Node.js
        if (env.window) {
          // Browser environment - expect styled output
          expect(mockConsole.error).toHaveBeenCalledWith(
            '%cTest error',
            'color: #D67C2A; font-weight: bold'
          );
        } else {
          // Node.js environment - expect ANSI colored output
          expect(mockConsole.error).toHaveBeenCalledWith(
            expect.stringContaining('Test error')
          );
        }
        expect(mockConsole.error).toHaveBeenCalledWith(error.stack);
      });
    });
  });

  describe('performance consistency', () => {
    test('disabled logging performs consistently', () => {
      const environments = [
        { window: { localStorage: {} }, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } },
        { window: undefined, process: { env: { NODE_ENV: 'development' }, cwd: () => '/test' } }
      ];

      environments.forEach(env => {
        if (env.window) {
          global.window = env.window as any;
        } else {
          delete (global as any).window;
        }
        global.process = env.process as any;

        const logger = createLogger({ enabled: false });

        const startTime = Date.now();
        
        for (let i = 0; i < 1000; i++) {
          logger.info(`Message ${i}`);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(50);
        expect(mockConsole.info).not.toHaveBeenCalled();
      });
    });
  });
});