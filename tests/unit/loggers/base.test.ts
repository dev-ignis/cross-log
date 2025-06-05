/**
 * Unit tests for BaseLogger
 */

import { BaseLogger } from '../../../src/loggers/base';
import { LogLevel, LogEntry } from '../../../src/core/types';

// Concrete implementation for testing
class TestLogger extends BaseLogger {
  public outputLogs: Array<{
    level: LogLevel;
    message: string;
    entry: LogEntry;
    args: unknown[];
  }> = [];

  public stackTraces: Error[] = [];

  protected outputLog(
    level: LogLevel,
    formattedMessage: string,
    logEntry: LogEntry,
    ...args: unknown[]
  ): void {
    this.outputLogs.push({
      level,
      message: formattedMessage,
      entry: logEntry,
      args
    });
  }

  protected outputStackTrace(error: Error): void {
    this.stackTraces.push(error);
  }

  public clearLogs(): void {
    this.outputLogs = [];
    this.stackTraces = [];
  }
}

describe('BaseLogger', () => {
  let logger: TestLogger;

  beforeEach(() => {
    logger = new TestLogger();
    logger.clearLogs();
  });

  describe('basic logging methods', () => {
    test('logs debug messages', () => {
      logger.debug('test debug message');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.DEBUG);
      expect(logger.outputLogs[0]?.entry.message).toBe('test debug message');
    });

    test('logs info messages', () => {
      logger.info('test info message');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.INFO);
      expect(logger.outputLogs[0]?.entry.message).toBe('test info message');
    });

    test('logs warning messages', () => {
      logger.warn('test warning message');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.WARN);
      expect(logger.outputLogs[0]?.entry.message).toBe('test warning message');
    });

    test('logs error messages', () => {
      logger.error('test error message');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.ERROR);
      expect(logger.outputLogs[0]?.entry.message).toBe('test error message');
    });

    test('logs Error objects', () => {
      const error = new Error('test error object');
      logger.error(error);

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.ERROR);
      expect(logger.outputLogs[0]?.entry.message).toBe('test error object');
      expect(logger.stackTraces).toHaveLength(1);
      expect(logger.stackTraces[0]).toBe(error);
    });
  });

  describe('log level filtering', () => {
    test('respects minimum log level', () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logger.outputLogs).toHaveLength(2);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.WARN);
      expect(logger.outputLogs[1]?.level).toBe(LogLevel.ERROR);
    });

    test('SILENT level blocks all messages', () => {
      logger.setLevel(LogLevel.SILENT);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logger.outputLogs).toHaveLength(0);
    });
  });

  describe('global enable/disable', () => {
    test('disableAll stops all logging', () => {
      logger.disableAll();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(logger.outputLogs).toHaveLength(0);
      expect(logger.isEnabled()).toBe(false);
    });

    test('enableAll restores logging', () => {
      logger.disableAll();
      logger.enableAll();

      logger.debug('debug message');
      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.isEnabled()).toBe(true);
    });
  });

  describe('category-based logging', () => {
    test('logs with categories', () => {
      logger.info('test message', 'test-category');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.entry.category).toBe('test-category');
    });

    test('enables specific categories', () => {
      logger.setLevel(LogLevel.WARN);
      logger.enableCategory('debug-category', LogLevel.DEBUG);

      logger.debug('global debug'); // Should be blocked
      logger.debug('category debug', 'debug-category'); // Should pass
      logger.warn('global warn'); // Should pass

      expect(logger.outputLogs).toHaveLength(2);
      expect(logger.outputLogs[0]?.entry.category).toBe('debug-category');
      expect(logger.outputLogs[1]?.entry.category).toBeUndefined();
    });

    test('disables specific categories', () => {
      logger.disableCategory('disabled-category');

      logger.info('normal message');
      logger.info('disabled message', 'disabled-category');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.entry.category).toBeUndefined();
    });

    test('category-specific log levels', () => {
      logger.enableCategory('warn-category', LogLevel.WARN);

      logger.debug('debug message', 'warn-category');
      logger.info('info message', 'warn-category');
      logger.warn('warn message', 'warn-category');

      expect(logger.outputLogs).toHaveLength(1);
      expect(logger.outputLogs[0]?.level).toBe(LogLevel.WARN);
    });
  });

  describe('duplicate log prevention', () => {
    test('prevents duplicate logs within threshold', () => {
      logger.debug('duplicate message');
      logger.debug('duplicate message');
      logger.debug('duplicate message');

      expect(logger.outputLogs).toHaveLength(1);
    });

    test('allows duplicate logs after threshold', (done) => {
      logger.debug('duplicate message');
      
      // Override threshold for testing
      (logger as any).duplicateThreshold = 10;
      
      setTimeout(() => {
        logger.debug('duplicate message');
        expect(logger.outputLogs).toHaveLength(2);
        done();
      }, 15);
    });

    test('treats different categories as different messages', () => {
      logger.debug('same message', 'category1');
      logger.debug('same message', 'category2');

      expect(logger.outputLogs).toHaveLength(2);
    });
  });

  describe('configuration management', () => {
    test('updates configuration', () => {
      const newConfig = {
        enabled: false,
        showTimestamp: false
      };

      logger.configure(newConfig);
      const config = logger.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.showTimestamp).toBe(false);
    });

    test('provides access to LogLevel enum', () => {
      expect(logger.Level.DEBUG).toBe(LogLevel.DEBUG);
      expect(logger.Level.INFO).toBe(LogLevel.INFO);
      expect(logger.Level.WARN).toBe(LogLevel.WARN);
      expect(logger.Level.ERROR).toBe(LogLevel.ERROR);
      expect(logger.Level.SILENT).toBe(LogLevel.SILENT);
    });
  });

  describe('message formatting', () => {
    test('includes timestamps when enabled', () => {
      logger.configure({ showTimestamp: true });
      logger.info('test message');

      const message = logger.outputLogs[0]?.message;
      expect(message).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] test message$/);
    });

    test('excludes timestamps when disabled', () => {
      logger.configure({ showTimestamp: false });
      logger.info('test message');

      const message = logger.outputLogs[0]?.message;
      expect(message).toBe('test message');
    });

    test('includes category in formatted message', () => {
      logger.configure({ showTimestamp: false });
      logger.info('test message', 'test-category');

      const message = logger.outputLogs[0]?.message;
      expect(message).toBe('[test-category] test message');
    });
  });

  describe('additional arguments', () => {
    test('passes additional arguments to output', () => {
      const obj = { key: 'value' };
      const arr = [1, 2, 3];

      logger.info('test message', undefined, obj, arr);

      expect(logger.outputLogs[0]?.args).toEqual([obj, arr]);
    });

    test('passes additional arguments with categories', () => {
      const extra = 'extra data';

      logger.info('test message', 'category', extra);

      expect(logger.outputLogs[0]?.entry.category).toBe('category');
      expect(logger.outputLogs[0]?.args).toEqual([extra]);
    });
  });

  describe('error stack traces', () => {
    test('outputs stack traces for Error objects when enabled', () => {
      logger.configure({ includeStackTrace: true });
      const error = new Error('test error');

      logger.error(error);

      expect(logger.stackTraces).toHaveLength(1);
      expect(logger.stackTraces[0]).toBe(error);
    });

    test('skips stack traces when disabled', () => {
      logger.configure({ includeStackTrace: false });
      const error = new Error('test error');

      logger.error(error);

      expect(logger.stackTraces).toHaveLength(0);
    });

    test('skips stack traces for string error messages', () => {
      logger.configure({ includeStackTrace: true });

      logger.error('string error message');

      expect(logger.stackTraces).toHaveLength(0);
    });
  });
});