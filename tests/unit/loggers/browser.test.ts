/**
 * Unit tests for BrowserLogger
 */

import { BrowserLogger } from '../../../src/loggers/browser';
import { LogLevel } from '../../../src/core/types';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

describe('BrowserLogger', () => {
  const originalConsole = global.console;
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock console
    global.console = mockConsole as any;
    
    // Mock window and localStorage
    global.window = {
      localStorage: mockLocalStorage
    } as any;
    global.localStorage = mockLocalStorage as any;

    // Reset mocks
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    global.console = originalConsole;
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  });

  describe('initialization', () => {
    test('creates logger with default configuration', () => {
      const logger = new BrowserLogger();
      const config = logger.getConfig();

      expect(config.storage.enabled).toBe(true);
      expect(config.browserControls.enabled).toBe(true);
      expect(config.colors.enabled).toBe(true);
    });

    test('loads configuration from localStorage', () => {
      const savedConfig = {
        enabled: false,
        minLevel: LogLevel.ERROR
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'universal_logger_config') {
          return JSON.stringify(savedConfig);
        }
        if (key === 'universal_logger_enabled') {
          return 'false';
        }
        return null;
      });

      const logger = new BrowserLogger();
      const config = logger.getConfig();

      expect(config.enabled).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('universal_logger_config');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('universal_logger_enabled');
    });

    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => new BrowserLogger()).not.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error loading logger config from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('logging output', () => {
    test('outputs logs with colors when enabled', () => {
      const logger = new BrowserLogger({
        colors: { 
          enabled: true,
          browser: {
            debug: '#6EC1E4',
            info: '#4A9FCA',
            warn: '#FBC02D',
            error: '#D67C2A'
          },
          ansi: {
            debug: 36,
            info: 36,
            warn: 33,
            error: 31
          }
        },
        showTimestamp: false
      });

      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        '%ctest message',
        'color: #4A9FCA; font-weight: bold'
      );
    });

    test('outputs logs without colors when disabled', () => {
      const logger = new BrowserLogger({
        colors: { enabled: false, browser: {} as any, ansi: {} as any },
        showTimestamp: false
      });

      logger.info('test message');

      expect(mockConsole.info).toHaveBeenCalledWith('test message');
    });

    test('outputs debug logs with correct styling', () => {
      const logger = new BrowserLogger({
        colors: { 
          enabled: true,
          browser: { debug: '#6EC1E4', info: '', warn: '', error: '' },
          ansi: {} as any
        },
        showTimestamp: false
      });

      logger.debug('debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '%cdebug message',
        'color: #6EC1E4; font-weight: bold'
      );
    });

    test('outputs warning logs with correct styling', () => {
      const logger = new BrowserLogger({
        colors: { 
          enabled: true,
          browser: { debug: '', info: '', warn: '#FBC02D', error: '' },
          ansi: {} as any
        },
        showTimestamp: false
      });

      logger.warn('warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '%cwarning message',
        'color: #FBC02D; font-weight: bold'
      );
    });

    test('outputs error logs with correct styling', () => {
      const logger = new BrowserLogger({
        colors: { 
          enabled: true,
          browser: { debug: '', info: '', warn: '', error: '#D67C2A' },
          ansi: {} as any
        },
        showTimestamp: false
      });

      logger.error('error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        '%cerror message',
        'color: #D67C2A; font-weight: bold'
      );
    });

    test('passes additional arguments to console', () => {
      const logger = new BrowserLogger({
        colors: { enabled: false, browser: {} as any, ansi: {} as any },
        showTimestamp: false
      });

      const obj = { key: 'value' };
      logger.info('test message', undefined, obj);

      expect(mockConsole.info).toHaveBeenCalledWith('test message', obj);
    });
  });

  describe('error stack traces', () => {
    test('outputs stack traces for Error objects', () => {
      const logger = new BrowserLogger();
      const error = new Error('test error');
      error.stack = 'Error: test error\n    at test.js:1:1';

      logger.error(error);

      expect(mockConsole.error).toHaveBeenCalledWith(error.stack);
    });

    test('handles errors without stack traces', () => {
      const logger = new BrowserLogger();
      const error = new Error('test error');
      delete error.stack;

      expect(() => logger.error(error)).not.toThrow();
    });
  });

  describe('localStorage persistence', () => {
    test('saves configuration to localStorage on configure', () => {
      const logger = new BrowserLogger();
      
      logger.configure({ enabled: false });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'universal_logger_config',
        expect.stringContaining('"enabled":false')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'universal_logger_enabled',
        'false'
      );
    });

    test('saves configuration on setLevel', () => {
      const logger = new BrowserLogger();
      
      logger.setLevel(LogLevel.ERROR);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('saves configuration on enableCategory', () => {
      const logger = new BrowserLogger();
      
      logger.enableCategory('test-category');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('saves configuration on disableCategory', () => {
      const logger = new BrowserLogger();
      
      logger.disableCategory('test-category');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('saves configuration on enableAll', () => {
      const logger = new BrowserLogger();
      
      logger.enableAll();

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('saves configuration on disableAll', () => {
      const logger = new BrowserLogger();
      
      logger.disableAll();

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    test('handles localStorage save errors gracefully', () => {
      // Create logger first with working localStorage
      const logger = new BrowserLogger();
      
      // Then break setItem to trigger error during save
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => logger.configure({ enabled: false })).not.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error saving logger config to localStorage:',
        expect.any(Error)
      );
    });

    test('skips localStorage when disabled', () => {
      // Mock to prevent storage availability check calls
      const mockWindow = {
        localStorage: {
          getItem: jest.fn().mockReturnValue(null),
          setItem: jest.fn(),
          removeItem: jest.fn()
        }
      };
      global.window = mockWindow as any;
      
      const logger = new BrowserLogger({
        storage: { enabled: false, keyPrefix: 'test' }
      });
      
      // Clear calls from constructor and availability check
      jest.clearAllMocks();
      
      logger.configure({ enabled: false });

      expect(mockWindow.localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('browser controls', () => {
    test('sets up window controls when enabled', () => {
      const mockWindow = {
        localStorage: mockLocalStorage
      } as any;
      global.window = mockWindow;

      const logger = new BrowserLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      expect(mockWindow.__testLogger).toBe(logger);
      expect(typeof mockWindow.enableTestLoggerLogging).toBe('function');
      expect(typeof mockWindow.disableTestLoggerLogging).toBe('function');
      expect(typeof mockWindow.testLoggerLoggingStatus).toBe('function');
    });

    test('enable function works correctly', () => {
      const mockWindow = {
        localStorage: mockLocalStorage
      } as any;
      global.window = mockWindow;

      new BrowserLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      const result = mockWindow.enableTestLoggerLogging();

      expect(typeof result).toBe('string');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging enabled!'),
        expect.any(String)
      );
    });

    test('disable function works correctly', () => {
      const mockWindow = {
        localStorage: mockLocalStorage
      } as any;
      global.window = mockWindow;

      new BrowserLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      const result = mockWindow.disableTestLoggerLogging();

      expect(result).toBe('Logging disabled.');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging disabled!'),
        expect.any(String)
      );
    });

    test('status function works correctly', () => {
      const mockWindow = {
        localStorage: mockLocalStorage
      } as any;
      global.window = mockWindow;

      new BrowserLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      const result = mockWindow.testLoggerLoggingStatus();

      expect(result).toHaveProperty('enabled');
      expect(result).toHaveProperty('config');
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging is currently'),
        expect.any(String)
      );
    });

    test('skips browser controls when disabled', () => {
      const mockWindow = {
        localStorage: mockLocalStorage
      } as any;
      global.window = mockWindow;

      new BrowserLogger({
        browserControls: {
          enabled: false,
          windowNamespace: '__testLogger'
        }
      });

      expect(mockWindow.__testLogger).toBeUndefined();
    });

    test('skips browser controls when window is undefined', () => {
      global.window = undefined as any;

      expect(() => new BrowserLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      })).not.toThrow();
    });
  });

  describe('localStorage availability', () => {
    test('handles missing localStorage gracefully', () => {
      global.window = {} as any;
      global.localStorage = undefined as any;

      expect(() => new BrowserLogger()).not.toThrow();
    });

    test('handles localStorage that throws on access', () => {
      const mockWindowWithBrokenStorage = {
        get localStorage() {
          throw new Error('Storage disabled');
        }
      };
      global.window = mockWindowWithBrokenStorage as any;

      expect(() => new BrowserLogger()).not.toThrow();
    });

    test('detects localStorage availability correctly', () => {
      global.window = {
        localStorage: {
          setItem: jest.fn(),
          removeItem: jest.fn(),
          getItem: jest.fn().mockReturnValue(null)
        }
      } as any;

      const logger = new BrowserLogger();
      logger.configure({ enabled: false });

      expect(global.window.localStorage.setItem).toHaveBeenCalled();
    });
  });
});