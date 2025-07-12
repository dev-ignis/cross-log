/**
 * Tests for Edge Runtime logger
 */

import { EdgeLogger } from '../../../src/loggers/edge';
import { LogLevel } from '../../../src/core/types';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Replace global console
(global as any).console = mockConsole;

describe('EdgeLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('creates logger with default configuration', () => {
      const logger = new EdgeLogger();
      const config = logger.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.minLevel).toBe(LogLevel.DEBUG);
      expect(config.showTimestamp).toBe(true);
      // Storage should be disabled in Edge Runtime
      expect(config.storage.enabled).toBe(false);
      // Browser controls should be disabled in Edge Runtime
      expect(config.browserControls.enabled).toBe(false);
    });

    test('creates logger with custom configuration', () => {
      const logger = new EdgeLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false,
        storage: { enabled: true, keyPrefix: 'test_' }, // Should be overridden
        browserControls: { enabled: true, windowNamespace: 'test' } // Should be overridden
      });

      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.showTimestamp).toBe(false);
      // These should still be disabled despite config
      expect(config.storage.enabled).toBe(false);
      expect(config.browserControls.enabled).toBe(false);
    });
  });

  describe('logging methods', () => {
    test('logs debug messages', () => {
      const logger = new EdgeLogger();
      logger.debug('Debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('Debug message')
      );
    });

    test('logs info messages', () => {
      const logger = new EdgeLogger();
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      );
    });

    test('logs warning messages', () => {
      const logger = new EdgeLogger();
      logger.warn('Warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });

    test('logs error messages', () => {
      const logger = new EdgeLogger();
      logger.error('Error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });

    test('logs Error objects', () => {
      const logger = new EdgeLogger();
      const error = new Error('Test error');
      logger.error(error);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });
  });

  describe('Edge Runtime compatibility', () => {
    test('does not use Node.js-specific APIs', () => {
      const logger = new EdgeLogger();
      
      // Should not throw in Edge Runtime environment
      expect(() => logger.debug('Test')).not.toThrow();
      expect(() => logger.info('Test')).not.toThrow();
      expect(() => logger.warn('Test')).not.toThrow();
      expect(() => logger.error('Test')).not.toThrow();
    });

    test('handles stack traces without Node.js APIs', () => {
      const logger = new EdgeLogger({ includeStackTrace: true });
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error(error);

      // Should log the stack trace using console.error
      expect(mockConsole.error).toHaveBeenCalledTimes(2);
      expect(mockConsole.error).toHaveBeenNthCalledWith(2, error.stack);
    });
  });

  describe('configuration', () => {
    test('configure method enforces Edge Runtime restrictions', () => {
      const logger = new EdgeLogger();
      
      logger.configure({
        minLevel: LogLevel.INFO,
        storage: { enabled: true, keyPrefix: 'test_' },
        browserControls: { enabled: true, windowNamespace: 'test' }
      });

      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.INFO);
      expect(config.storage.enabled).toBe(false);
      expect(config.browserControls.enabled).toBe(false);
    });
  });

  describe('level management', () => {
    test('respects log level settings', () => {
      const logger = new EdgeLogger({ minLevel: LogLevel.WARN });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });
});