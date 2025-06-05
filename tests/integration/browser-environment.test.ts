/**
 * Simplified Browser Environment Integration Tests
 * Focus on core browser functionality only
 */

import { createLogger, BrowserLogger, LogLevel } from '../../src/index';

// Mock browser environment
const mockLocalStorage = {
  getItem: jest.fn().mockReturnValue(null),
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

const mockWindow = {
  localStorage: mockLocalStorage
};

// Also set global localStorage for direct access
(global as any).localStorage = mockLocalStorage;

describe('Browser Environment Integration', () => {
  const originalWindow = global.window;
  const originalConsole = global.console;
  const originalProcess = global.process;

  beforeEach(() => {
    // Set up browser environment
    global.window = mockWindow as any;
    global.console = mockConsole as any;
    global.process = { env: { NODE_ENV: 'development' }, cwd: () => '/test' } as any;

    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    global.window = originalWindow;
    global.console = originalConsole;
    global.process = originalProcess;
  });

  describe('core browser functionality', () => {
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

      logger.info('Test message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        '%cTest message',
        expect.stringContaining('color:')
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

  describe('localStorage integration', () => {
    test('saves and loads configuration from localStorage', () => {
      const logger = createLogger();

      // Clear any calls from constructor/storage availability check
      jest.clearAllMocks();

      logger.configure({
        minLevel: LogLevel.ERROR,
        enabled: false
      });

      // Check that setItem was called with the config
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



  describe('environment variable overrides', () => {
    test('respects process.env in browser build tools', () => {
      global.process = {
        env: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'ERROR',
          LOGGER_COLORS: 'false',
          LOGGER_STORAGE_KEY_PREFIX: 'myapp'
        },
        cwd: () => '/test'
      } as any;

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.ERROR);
      expect(config.colors.enabled).toBe(false);
      expect(config.storage.keyPrefix).toBe('myapp');
    });
  });
});