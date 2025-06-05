/**
 * Tests for the main logger functionality
 */

import { createLogger, LogLevel, BrowserLogger, NodeLogger } from '../index';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Replace console methods
Object.assign(console, mockConsole);

describe('Universal Logger', () => {
  beforeEach(() => {
    // Clear all mocks
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  describe('createLogger', () => {
    it('should create BrowserLogger in browser environment', () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: { localStorage: {} },
        writable: true
      });

      const logger = createLogger();
      expect(logger).toBeInstanceOf(BrowserLogger);
    });

    it('should create NodeLogger in Node.js environment', () => {
      // Mock Node.js environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });

      const logger = createLogger();
      expect(logger).toBeInstanceOf(NodeLogger);
    });

    it('should accept initial configuration', () => {
      const logger = createLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.showTimestamp).toBe(false);
    });
  });

  describe('Default logger methods', () => {
    beforeEach(() => {
      // Ensure we're in Node.js environment for consistent testing
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
    });

    it('should log debug messages', () => {
      const logger = createLogger({ minLevel: LogLevel.DEBUG });
      logger.debug('Debug message');
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = createLogger();
      logger.info('Info message');
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const logger = createLogger();
      logger.warn('Warning message');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = createLogger();
      logger.error('Error message');
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should respect log levels', () => {
      const logger = createLogger({ minLevel: LogLevel.WARN });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle categories', () => {
      const logger = createLogger();
      
      logger.enableCategory('test', LogLevel.INFO);
      logger.info('Test message', 'test');
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should disable logging when disabled', () => {
      const logger = createLogger();
      
      logger.disableAll();
      logger.info('This should not appear');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should handle Error objects', () => {
      const logger = createLogger();
      const error = new Error('Test error');
      
      logger.error(error);
      
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const logger = createLogger();
      
      logger.configure({
        showTimestamp: false,
        includeStackTrace: false
      });

      const config = logger.getConfig();
      expect(config.showTimestamp).toBe(false);
      expect(config.includeStackTrace).toBe(false);
    });

    it('should set log level', () => {
      const logger = createLogger();
      
      logger.setLevel(LogLevel.ERROR);
      
      const config = logger.getConfig();
      expect(config.minLevel).toBe(LogLevel.ERROR);
    });

    it('should enable/disable categories', () => {
      const logger = createLogger();
      
      logger.enableCategory('api', LogLevel.WARN);
      logger.disableCategory('ui');

      const config = logger.getConfig();
      expect(config.categories.api).toEqual({
        enabled: true,
        minLevel: LogLevel.WARN
      });
      expect(config.categories.ui).toEqual({
        enabled: false,
        minLevel: LogLevel.DEBUG
      });
    });
  });
});
