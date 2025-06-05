/**
 * Unit tests for the main index module
 */

import logger, {
  createLogger,
  debug,
  info,
  warn,
  error,
  setLevel,
  configure,
  enableCategory,
  disableCategory,
  enableAll,
  disableAll,
  getConfig,
  isEnabled,
  Level,
  BrowserLogger,
  NodeLogger,
  LogLevel
} from '../../src/index';

// Mock the environment detection
jest.mock('../../src/core/utils', () => {
  const actual = jest.requireActual('../../src/core/utils');
  return {
    ...actual,
    detectEnvironment: jest.fn()
  };
});

import { detectEnvironment } from '../../src/core/utils';

const mockDetectEnvironment = detectEnvironment as jest.MockedFunction<typeof detectEnvironment>;

describe('Universal Logger Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLogger', () => {
    test('creates BrowserLogger for browser environment', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: true,
        isNode: false,
        isDevelopment: true,
        isProduction: false
      });

      const loggerInstance = createLogger();
      expect(loggerInstance).toBeInstanceOf(BrowserLogger);
    });

    test('creates NodeLogger for Node.js environment', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: false,
        isNode: true,
        isDevelopment: true,
        isProduction: false
      });

      const loggerInstance = createLogger();
      expect(loggerInstance).toBeInstanceOf(NodeLogger);
    });

    test('passes configuration to logger instance', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: false,
        isNode: true,
        isDevelopment: true,
        isProduction: false
      });

      const config = {
        minLevel: LogLevel.WARN,
        enabled: false
      };

      const loggerInstance = createLogger(config);
      const actualConfig = loggerInstance.getConfig();

      expect(actualConfig.minLevel).toBe(LogLevel.WARN);
      expect(actualConfig.enabled).toBe(false);
    });
  });

  describe('default logger instance', () => {
    test('exports working default logger', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('default logger has all expected methods', () => {
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
  });

  describe('convenience exports', () => {
    test('exports individual logger methods', () => {
      expect(typeof debug).toBe('function');
      expect(typeof info).toBe('function');
      expect(typeof warn).toBe('function');
      expect(typeof error).toBe('function');
      expect(typeof setLevel).toBe('function');
      expect(typeof configure).toBe('function');
      expect(typeof enableCategory).toBe('function');
      expect(typeof disableCategory).toBe('function');
      expect(typeof enableAll).toBe('function');
      expect(typeof disableAll).toBe('function');
      expect(typeof getConfig).toBe('function');
      expect(typeof isEnabled).toBe('function');
      expect(Level).toBeDefined();
    });

    test('convenience methods are bound to default logger', () => {
      const config = getConfig();
      const loggerConfig = logger.getConfig();
      
      expect(config).toEqual(loggerConfig);
    });

    test('level enum is accessible', () => {
      expect(Level.DEBUG).toBe(LogLevel.DEBUG);
      expect(Level.INFO).toBe(LogLevel.INFO);
      expect(Level.WARN).toBe(LogLevel.WARN);
      expect(Level.ERROR).toBe(LogLevel.ERROR);
      expect(Level.SILENT).toBe(LogLevel.SILENT);
    });
  });

  describe('logger class exports', () => {
    test('exports BrowserLogger class', () => {
      expect(BrowserLogger).toBeDefined();
      expect(typeof BrowserLogger).toBe('function');
      
      const instance = new BrowserLogger();
      expect(instance).toBeInstanceOf(BrowserLogger);
    });

    test('exports NodeLogger class', () => {
      expect(NodeLogger).toBeDefined();
      expect(typeof NodeLogger).toBe('function');
      
      const instance = new NodeLogger();
      expect(instance).toBeInstanceOf(NodeLogger);
    });
  });

  describe('type exports', () => {
    test('exports LogLevel enum', () => {
      expect(LogLevel).toBeDefined();
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.SILENT).toBe(4);
    });
  });

  describe('integration with logger instances', () => {
    test('createLogger produces functional logger for browser', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: true,
        isNode: false,
        isDevelopment: true,
        isProduction: false
      });

      const loggerInstance = createLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      expect(loggerInstance.getConfig().minLevel).toBe(LogLevel.WARN);
      expect(loggerInstance.getConfig().showTimestamp).toBe(false);
      expect(loggerInstance.isEnabled()).toBe(true);
    });

    test('createLogger produces functional logger for Node.js', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: false,
        isNode: true,
        isDevelopment: false,
        isProduction: true
      });

      const loggerInstance = createLogger({
        minLevel: LogLevel.ERROR,
        enabled: false
      });

      expect(loggerInstance.getConfig().minLevel).toBe(LogLevel.ERROR);
      expect(loggerInstance.getConfig().enabled).toBe(false);
      expect(loggerInstance.isEnabled()).toBe(false);
    });
  });

  describe('method binding', () => {
    test('convenience methods work when destructured', () => {
      const { info: infoMethod, getConfig: getConfigMethod } = require('../../src/index');
      
      expect(typeof infoMethod).toBe('function');
      expect(typeof getConfigMethod).toBe('function');
      
      // These should not throw when called without context
      const config = getConfigMethod();
      expect(config).toBeDefined();
    });

    test('default logger methods work when destructured', () => {
      const { debug: debugMethod, isEnabled: isEnabledMethod } = logger;
      
      expect(typeof debugMethod).toBe('function');
      expect(typeof isEnabledMethod).toBe('function');
      
      // These should not throw when called without context
      const enabled = isEnabledMethod();
      expect(typeof enabled).toBe('boolean');
    });
  });

  describe('multiple logger instances', () => {
    test('can create multiple independent logger instances', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: false,
        isNode: true,
        isDevelopment: true,
        isProduction: false
      });

      const logger1 = createLogger({ minLevel: LogLevel.DEBUG });
      const logger2 = createLogger({ minLevel: LogLevel.ERROR });

      expect(logger1.getConfig().minLevel).toBe(LogLevel.DEBUG);
      expect(logger2.getConfig().minLevel).toBe(LogLevel.ERROR);

      logger1.setLevel(LogLevel.WARN);
      expect(logger1.getConfig().minLevel).toBe(LogLevel.WARN);
      expect(logger2.getConfig().minLevel).toBe(LogLevel.ERROR);
    });

    test('default logger is independent of created loggers', () => {
      mockDetectEnvironment.mockReturnValue({
        isBrowser: false,
        isNode: true,
        isDevelopment: true,
        isProduction: false
      });

      const customLogger = createLogger({ enabled: false });
      
      expect(customLogger.isEnabled()).toBe(false);
      expect(logger.isEnabled()).toBe(true);

      customLogger.enableAll();
      logger.disableAll();

      expect(customLogger.isEnabled()).toBe(true);
      expect(logger.isEnabled()).toBe(false);
    });
  });
});