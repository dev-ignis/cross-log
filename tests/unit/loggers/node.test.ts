/**
 * Unit tests for NodeLogger
 */

import { NodeLogger } from '../../../src/loggers/node';
import { LogLevel } from '../../../src/core/types';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

describe('NodeLogger', () => {
  const originalConsole = global.console;

  beforeEach(() => {
    global.console = mockConsole as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('initialization', () => {
    test('creates logger with default configuration', () => {
      const logger = new NodeLogger();
      const config = logger.getConfig();

      expect(config.storage.enabled).toBe(false);
      expect(config.browserControls.enabled).toBe(false);
    });

    test('accepts custom configuration', () => {
      const customConfig = {
        minLevel: LogLevel.WARN,
        colors: {
          enabled: false,
          browser: {
            debug: '',
            info: '',
            warn: '',
            error: ''
          },
          ansi: {
            debug: 31,
            info: 32,
            warn: 33,
            error: 34
          }
        }
      };

      const logger = new NodeLogger(customConfig);
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.colors.enabled).toBe(false);
      expect(config.colors.ansi.debug).toBe(31);
    });
  });

  describe('logging output', () => {
    test('outputs logs with ANSI colors when enabled', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {
            debug: '',
            info: '',
            warn: '',
            error: ''
          },
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        '\x1b[32mtest message\x1b[0m'
      );
    });

    test('outputs logs without colors when disabled', () => {
      const logger = new NodeLogger({
        colors: { enabled: false, browser: {} as any, ansi: {} as any },
        showTimestamp: false
      });

      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith('test message');
    });

    test('outputs debug logs with correct ANSI color', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.debug('debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '\x1b[36mdebug message\x1b[0m'
      );
    });

    test('outputs warning logs with correct ANSI color', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.warn('warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '\x1b[33mwarning message\x1b[0m'
      );
    });

    test('outputs error logs with correct ANSI color', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.error('error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        '\x1b[31merror message\x1b[0m'
      );
    });

    test('uses info color for unknown log levels', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      // Force an unknown level through the protected method
      (logger as any).outputLog(999 as LogLevel, 'unknown message', {
        level: 999,
        message: 'unknown message',
        timestamp: new Date(),
        args: []
      });

      expect(mockConsole.log).toHaveBeenCalledWith(
        '\x1b[32munknown message\x1b[0m'
      );
    });

    test('passes additional arguments to console', () => {
      const logger = new NodeLogger({
        colors: { enabled: false, browser: {} as any, ansi: {} as any },
        showTimestamp: false
      });

      const obj = { key: 'value' };
      const arr = [1, 2, 3];
      logger.info('test message', undefined, obj, arr);

      expect(mockConsole.info).toHaveBeenCalledWith('test message', obj, arr);
    });
  });

  describe('error stack traces', () => {
    test('outputs stack traces for Error objects', () => {
      const logger = new NodeLogger();
      const error = new Error('test error');
      error.stack = 'Error: test error\n    at test.js:1:1';

      logger.error(error);

      expect(mockConsole.error).toHaveBeenCalledWith(error.stack);
    });

    test('handles errors without stack traces', () => {
      const logger = new NodeLogger();
      const error = new Error('test error');
      delete error.stack;

      expect(() => logger.error(error)).not.toThrow();
      // Should not call console.error for stack trace
      expect(mockConsole.error).toHaveBeenCalledTimes(1); // Only for the main error message
    });
  });

  describe('log level filtering', () => {
    test('respects minimum log level', () => {
      const logger = new NodeLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith('warn message');
      expect(mockConsole.error).toHaveBeenCalledWith('error message');
    });

    test('SILENT level blocks all messages', () => {
      const logger = new NodeLogger({
        minLevel: LogLevel.SILENT,
        showTimestamp: false
      });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });
  });

  describe('category-based logging', () => {
    test('supports category-based filtering', () => {
      const logger = new NodeLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      logger.enableCategory('debug-category', LogLevel.DEBUG);

      logger.debug('global debug'); // Should be blocked
      logger.debug('category debug', 'debug-category'); // Should pass
      logger.warn('global warn'); // Should pass

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith('[debug-category] category debug');
      expect(mockConsole.warn).toHaveBeenCalledWith('global warn');
    });

    test('can disable specific categories', () => {
      const logger = new NodeLogger({ showTimestamp: false });

      logger.disableCategory('disabled-category');

      logger.info('normal message');
      logger.info('disabled message', 'disabled-category');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledWith('normal message');
    });
  });

  describe('message formatting', () => {
    test('includes timestamps when enabled', () => {
      const logger = new NodeLogger({
        showTimestamp: true,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('test message');

      const call = mockConsole.info.mock.calls[0];
      expect(call[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] test message$/);
    });

    test('excludes timestamps when disabled', () => {
      const logger = new NodeLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith('test message');
    });

    test('includes category in formatted message', () => {
      const logger = new NodeLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('test message', 'test-category');

      expect(mockConsole.info).toHaveBeenCalledWith('[test-category] test message');
    });
  });

  describe('ANSI color codes', () => {
    test('generates correct ANSI color sequences', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 96,  // Bright cyan
            info: 94,   // Bright blue
            warn: 93,   // Bright yellow
            error: 91   // Bright red
          }
        },
        showTimestamp: false
      });

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(mockConsole.debug).toHaveBeenCalledWith('\x1b[96mdebug\x1b[0m');
      expect(mockConsole.info).toHaveBeenCalledWith('\x1b[94minfo\x1b[0m');
      expect(mockConsole.warn).toHaveBeenCalledWith('\x1b[93mwarn\x1b[0m');
      expect(mockConsole.error).toHaveBeenCalledWith('\x1b[91merror\x1b[0m');
    });

    test('uses default colors when not specified', () => {
      const logger = new NodeLogger({
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 36,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.info('test');

      expect(mockConsole.info).toHaveBeenCalledWith('\x1b[36mtest\x1b[0m');
    });
  });

  describe('inheritance from BaseLogger', () => {
    test('inherits all BaseLogger functionality', () => {
      const logger = new NodeLogger();

      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.setLevel).toBe('function');
      expect(typeof logger.configure).toBe('function');
      expect(typeof logger.enableCategory).toBe('function');
      expect(typeof logger.disableCategory).toBe('function');
      expect(typeof logger.enableAll).toBe('function');
      expect(typeof logger.disableAll).toBe('function');
      expect(typeof logger.getConfig).toBe('function');
      expect(typeof logger.isEnabled).toBe('function');
      expect(logger.Level).toBeDefined();
    });

    test('supports duplicate log prevention', () => {
      const logger = new NodeLogger({ showTimestamp: false });

      logger.info('duplicate message');
      logger.info('duplicate message');
      logger.info('duplicate message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });
  });
});