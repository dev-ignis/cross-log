/**
 * Integration tests for browser environment
 */

import { createLogger, BrowserLogger, LogLevel } from '../../src/index';

// Mock browser environment
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock window object
const mockWindow = {
  localStorage: mockLocalStorage
};

describe('Browser Environment Integration', () => {
  const originalWindow = global.window;
  const originalConsole = global.console;
  const originalProcess = global.process;

  beforeEach(() => {
    // Set up browser environment
    global.window = mockWindow as any;
    global.console = mockConsole as any;
    global.process = { env: { NODE_ENV: 'development' } } as any;

    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    global.window = originalWindow;
    global.console = originalConsole;
    global.process = originalProcess;
  });

  describe('automatic environment detection', () => {
    test('createLogger returns BrowserLogger in browser environment', () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(BrowserLogger);
    });

    test('browser logger has correct default configuration', () => {
      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.storage.enabled).toBe(true);
      expect(config.browserControls.enabled).toBe(true);
      expect(config.colors.enabled).toBe(true);
      expect(config.minLevel).toBe(LogLevel.DEBUG);
    });
  });

  describe('localStorage integration', () => {
    test('saves and loads configuration from localStorage', () => {
      const logger = createLogger();
      
      logger.configure({
        minLevel: LogLevel.ERROR,
        enabled: false
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'universal_logger_config',
        expect.stringContaining('"minLevel":3')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'universal_logger_enabled',
        'false'
      );
    });

    test('loads existing configuration on initialization', () => {
      const savedConfig = {
        minLevel: LogLevel.WARN,
        colors: {
          enabled: false,
          browser: {
            debug: '#FF0000',
            info: '#00FF00',
            warn: '#FFFF00',
            error: '#FF00FF'
          },
          ansi: {
            debug: 31,
            info: 32,
            warn: 33,
            error: 34
          }
        }
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'universal_logger_config') {
          return JSON.stringify(savedConfig);
        }
        if (key === 'universal_logger_enabled') {
          return 'true';
        }
        return null;
      });

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.colors.enabled).toBe(false);
      expect(config.colors.browser.debug).toBe('#FF0000');
    });

    test('persists category configurations', () => {
      const logger = createLogger();
      
      logger.enableCategory('api', LogLevel.WARN);
      logger.disableCategory('debug');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      const config = logger.getConfig();
      expect(config.categories['api']).toEqual({
        enabled: true,
        minLevel: LogLevel.WARN
      });
      expect(config.categories['debug']).toEqual({
        enabled: false,
        minLevel: LogLevel.DEBUG
      });
    });
  });

  describe('browser console output', () => {
    test('outputs styled logs in browser', () => {
      const logger = createLogger({
        showTimestamp: false,
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
        }
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '%cDebug message',
        'color: #6EC1E4; font-weight: bold'
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        '%cInfo message',
        'color: #4A9FCA; font-weight: bold'
      );
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '%cWarning message',
        'color: #FBC02D; font-weight: bold'
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        '%cError message',
        'color: #D67C2A; font-weight: bold'
      );
    });

    test('outputs unstyled logs when colors disabled', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('Plain message');

      expect(mockConsole.info).toHaveBeenCalledWith('Plain message');
    });

    test('handles additional arguments correctly', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      const data = { user: 'john', action: 'login' };
      logger.info('User action', 'auth', data);

      expect(mockConsole.info).toHaveBeenCalledWith('[auth] User action', data);
    });
  });

  describe('browser controls integration', () => {
    test('sets up window controls in development', () => {
      global.process = { env: { NODE_ENV: 'development' } } as any;
      
      const logger = createLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      expect((global.window as any).__testLogger).toBe(logger);
      expect(typeof (global.window as any).enableTestLoggerLogging).toBe('function');
      expect(typeof (global.window as any).disableTestLoggerLogging).toBe('function');
      expect(typeof (global.window as any).testLoggerLoggingStatus).toBe('function');
    });

    test('browser controls work correctly', () => {
      const logger = createLogger({
        browserControls: {
          enabled: true,
          windowNamespace: '__testLogger'
        }
      });

      const win = global.window as any;

      // Test enable function
      win.enableTestLoggerLogging();
      expect(logger.isEnabled()).toBe(true);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging enabled!'),
        expect.any(String)
      );

      // Test disable function
      win.disableTestLoggerLogging();
      expect(logger.isEnabled()).toBe(false);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Logging disabled!'),
        expect.any(String)
      );

      // Test status function
      const status = win.testLoggerLoggingStatus();
      expect(status).toHaveProperty('enabled', false);
      expect(status).toHaveProperty('config');
    });

    test('skips browser controls in production', () => {
      global.process = { env: { NODE_ENV: 'production' } } as any;
      
      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.browserControls.enabled).toBe(false);
      expect((global.window as any).__universalLogger).toBeUndefined();
    });
  });

  describe('error handling integration', () => {
    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const logger = createLogger();
      
      expect(() => {
        logger.configure({ enabled: false });
      }).not.toThrow();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error saving logger config to localStorage:',
        expect.any(Error)
      );
    });

    test('handles malformed localStorage data', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'universal_logger_config') {
          return '{"invalid": json}';
        }
        return null;
      });

      expect(() => createLogger()).not.toThrow();
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error loading logger config from localStorage:',
        expect.any(Error)
      );
    });

    test('outputs error stack traces', () => {
      const logger = createLogger();
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error(error);

      expect(mockConsole.error).toHaveBeenCalledWith(error.stack);
    });
  });

  describe('category-based logging in browser', () => {
    test('supports complex category scenarios', () => {
      const logger = createLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      logger.enableCategory('api', LogLevel.DEBUG);
      logger.enableCategory('ui', LogLevel.INFO);
      logger.disableCategory('analytics');

      logger.debug('API debug', 'api');           // Should show
      logger.info('UI info', 'ui');               // Should show
      logger.debug('General debug');              // Should not show
      logger.warn('Analytics warning', 'analytics'); // Should not show
      logger.error('General error');              // Should show

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      expect(mockConsole.warn).toHaveBeenCalledTimes(0);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('real-world usage scenarios', () => {
    test('application startup sequence', () => {
      // Simulate app startup
      const logger = createLogger();
      
      logger.info('Application starting...');
      logger.debug('Loading configuration', 'config');
      logger.info('Configuration loaded', 'config');
      logger.debug('Initializing modules', 'init');
      logger.info('Application ready');

      expect(mockConsole.info).toHaveBeenCalledTimes(3);
      expect(mockConsole.debug).toHaveBeenCalledTimes(2);
    });

    test('error logging with context', () => {
      const logger = createLogger({ showTimestamp: false });
      
      const error = new Error('Network request failed');
      const context = {
        url: 'https://api.example.com/data',
        method: 'GET',
        status: 500
      };

      logger.error('API request failed', 'network', error, context);

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[network] API request failed',
        error,
        context
      );
    });

    test('dynamic configuration changes', () => {
      const logger = createLogger();
      
      // Initially debug everything
      logger.info('Initial message');
      
      // Change to warn level
      logger.setLevel(LogLevel.WARN);
      logger.debug('Debug after level change'); // Should not show
      logger.warn('Warning after level change');  // Should show
      
      // Enable specific category for debug
      logger.enableCategory('special', LogLevel.DEBUG);
      logger.debug('Debug in special category', 'special'); // Should show
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('environment variable overrides in browser', () => {
    test('respects process.env in browser build tools', () => {
      global.process = {
        env: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'ERROR',
          LOGGER_COLORS: 'false',
          LOGGER_STORAGE_KEY_PREFIX: 'myapp'
        }
      } as any;

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.ERROR);
      expect(config.colors.enabled).toBe(false);
      expect(config.storage.keyPrefix).toBe('myapp');
    });
  });
});