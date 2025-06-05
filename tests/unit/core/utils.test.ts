/**
 * Unit tests for core utilities
 */

import {
  detectEnvironment,
  parseLogLevel,
  parseEnvBoolean,
  parseEnvInt,
  getEnvVar,
  formatTimestamp,
  isLoggingEnabled,
  formatMessage,
  getConsoleMethod,
  createAnsiColor,
  resetAnsiColor,
  safeStringify,
  debounce
} from '../../../src/core/utils';
import { LogLevel } from '../../../src/core/types';

describe('Core Utils', () => {
  describe('detectEnvironment', () => {
    const originalWindow = global.window;
    const originalProcess = global.process;

    afterEach(() => {
      global.window = originalWindow;
      global.process = originalProcess;
    });

    test('detects browser environment', () => {
      global.window = {} as any;
      delete (global as any).process;

      const env = detectEnvironment();
      expect(env.isBrowser).toBe(true);
      expect(env.isNode).toBe(false);
    });

    test('detects Node.js environment', () => {
      delete (global as any).window;
      global.process = { env: { NODE_ENV: 'development' } } as any;

      const env = detectEnvironment();
      expect(env.isBrowser).toBe(false);
      expect(env.isNode).toBe(true);
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
    });

    test('detects production environment', () => {
      delete (global as any).window;
      global.process = { env: { NODE_ENV: 'production' } } as any;

      const env = detectEnvironment();
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(true);
    });
  });

  describe('parseLogLevel', () => {
    test('parses valid log levels', () => {
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('Warn')).toBe(LogLevel.WARN);
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('SILENT')).toBe(LogLevel.SILENT);
    });

    test('returns null for invalid log levels', () => {
      expect(parseLogLevel('INVALID')).toBeNull();
      expect(parseLogLevel('')).toBeNull();
      expect(parseLogLevel(undefined)).toBeNull();
    });
  });

  describe('parseEnvBoolean', () => {
    test('parses boolean values correctly', () => {
      expect(parseEnvBoolean('true')).toBe(true);
      expect(parseEnvBoolean('TRUE')).toBe(true);
      expect(parseEnvBoolean('false')).toBe(false);
      expect(parseEnvBoolean('FALSE')).toBe(false);
      expect(parseEnvBoolean('invalid')).toBe(false);
    });

    test('uses default value when undefined', () => {
      expect(parseEnvBoolean(undefined, true)).toBe(true);
      expect(parseEnvBoolean(undefined, false)).toBe(false);
      expect(parseEnvBoolean(undefined)).toBe(false);
    });
  });

  describe('parseEnvInt', () => {
    test('parses integer values correctly', () => {
      expect(parseEnvInt('42', 0)).toBe(42);
      expect(parseEnvInt('0', 10)).toBe(0);
      expect(parseEnvInt('-5', 10)).toBe(-5);
    });

    test('uses default value for invalid input', () => {
      expect(parseEnvInt('invalid', 42)).toBe(42);
      expect(parseEnvInt('', 42)).toBe(42);
      expect(parseEnvInt(undefined, 42)).toBe(42);
    });
  });

  describe('getEnvVar', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('returns environment variable value', () => {
      process.env.TEST_VAR = 'test_value';
      expect(getEnvVar('TEST_VAR')).toBe('test_value');
    });

    test('returns default value when env var not found', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR', 'default')).toBe('default');
      expect(getEnvVar('TEST_VAR')).toBeUndefined();
    });

    test('handles missing process object', () => {
      const originalProcess = global.process;
      delete (global as any).process;

      expect(getEnvVar('TEST_VAR', 'default')).toBe('default');
      expect(getEnvVar('TEST_VAR')).toBeUndefined();

      global.process = originalProcess;
    });
  });

  describe('formatTimestamp', () => {
    test('formats timestamp as ISO string', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      expect(formatTimestamp(date)).toBe('2023-01-01T12:00:00.000Z');
    });

    test('uses current date when no date provided', () => {
      const timestamp = formatTimestamp();
      expect(typeof timestamp).toBe('string');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('isLoggingEnabled', () => {
    test('respects global enabled flag', () => {
      expect(isLoggingEnabled(LogLevel.DEBUG, LogLevel.INFO, false)).toBe(false);
      expect(isLoggingEnabled(LogLevel.DEBUG, LogLevel.INFO, true)).toBe(true);
    });

    test('respects log levels', () => {
      expect(isLoggingEnabled(LogLevel.WARN, LogLevel.DEBUG, true)).toBe(false);
      expect(isLoggingEnabled(LogLevel.WARN, LogLevel.ERROR, true)).toBe(true);
      expect(isLoggingEnabled(LogLevel.DEBUG, LogLevel.WARN, true)).toBe(true);
    });

    test('handles SILENT level', () => {
      expect(isLoggingEnabled(LogLevel.SILENT, LogLevel.ERROR, true)).toBe(false);
      expect(isLoggingEnabled(LogLevel.ERROR, LogLevel.SILENT, true)).toBe(false);
    });
  });

  describe('formatMessage', () => {
    test('formats message with timestamp and category', () => {
      const message = formatMessage('test message', 'test-category', true);
      expect(message).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[test-category\] test message$/);
    });

    test('formats message without timestamp', () => {
      const message = formatMessage('test message', 'test-category', false);
      expect(message).toBe('[test-category] test message');
    });

    test('formats message without category', () => {
      const message = formatMessage('test message', undefined, false);
      expect(message).toBe('test message');
    });
  });

  describe('getConsoleMethod', () => {
    test('returns correct console methods', () => {
      expect(getConsoleMethod(LogLevel.DEBUG)).toBe(console.debug);
      expect(getConsoleMethod(LogLevel.INFO)).toBe(console.info);
      expect(getConsoleMethod(LogLevel.WARN)).toBe(console.warn);
      expect(getConsoleMethod(LogLevel.ERROR)).toBe(console.error);
    });
  });

  describe('createAnsiColor', () => {
    test('creates ANSI color codes', () => {
      expect(createAnsiColor(31)).toBe('\x1b[31m');
      expect(createAnsiColor(36)).toBe('\x1b[36m');
    });
  });

  describe('resetAnsiColor', () => {
    test('returns reset ANSI code', () => {
      expect(resetAnsiColor()).toBe('\x1b[0m');
    });
  });

  describe('safeStringify', () => {
    test('stringifies objects safely', () => {
      expect(safeStringify({ test: 'value' })).toBe('{\n  "test": "value"\n}');
      expect(safeStringify('string')).toBe('string');
      expect(safeStringify(null)).toBe('null');
    });

    test('handles Error objects', () => {
      const error = new Error('test error');
      expect(safeStringify(error)).toBe('test error');
    });

    test('handles circular references', () => {
      const circular: any = { test: 'value' };
      circular.self = circular;
      expect(safeStringify(circular)).toBe('[Circular or non-serializable object]');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('debounces function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    test('cancels previous timeouts', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      jest.advanceTimersByTime(50);
      debouncedFn('arg2');
      jest.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg2');
    });
  });
});