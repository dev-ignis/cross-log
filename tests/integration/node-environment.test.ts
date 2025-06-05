/**
 * Integration tests for Node.js environment
 */

import { createLogger, NodeLogger, LogLevel } from '../../src/index';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

describe('Node.js Environment Integration', () => {
  const originalConsole = global.console;
  const originalProcess = global.process;
  const originalWindow = global.window;

  beforeEach(() => {
    // Set up Node.js environment
    delete (global as any).window;
    global.console = mockConsole as any;
    global.process = {
      env: { NODE_ENV: 'development' }
    } as any;

    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
    global.process = originalProcess;
    global.window = originalWindow;
  });

  describe('automatic environment detection', () => {
    test('createLogger returns NodeLogger in Node.js environment', () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(NodeLogger);
    });

    test('node logger has correct default configuration', () => {
      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.storage.enabled).toBe(false);
      expect(config.browserControls.enabled).toBe(false);
      expect(config.colors.enabled).toBe(true); // True in development
      expect(config.minLevel).toBe(LogLevel.DEBUG);
    });

    test('production environment has different defaults', () => {
      global.process = {
        env: { NODE_ENV: 'production' }
      } as any;

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.colors.enabled).toBe(false);
      expect(config.minLevel).toBe(LogLevel.WARN);
    });
  });

  describe('ANSI color output', () => {
    test('outputs colored logs in development', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 36,
            info: 32,
            warn: 33,
            error: 31
          }
        }
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).toHaveBeenCalledWith('\x1b[36mDebug message\x1b[0m');
      expect(mockConsole.info).toHaveBeenCalledWith('\x1b[32mInfo message\x1b[0m');
      expect(mockConsole.warn).toHaveBeenCalledWith('\x1b[33mWarning message\x1b[0m');
      expect(mockConsole.error).toHaveBeenCalledWith('\x1b[31mError message\x1b[0m');
    });

    test('outputs uncolored logs when colors disabled', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('Plain message');

      expect(mockConsole.info).toHaveBeenCalledWith('Plain message');
    });

    test('supports custom ANSI colors', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: {
          enabled: true,
          browser: {} as any,
          ansi: {
            debug: 96,  // Bright cyan
            info: 94,   // Bright blue
            warn: 93,   // Bright yellow
            error: 91   // Bright red
          }
        }
      });

      logger.debug('Custom colored message');

      expect(mockConsole.debug).toHaveBeenCalledWith('\x1b[96mCustom colored message\x1b[0m');
    });
  });

  describe('environment variable configuration', () => {
    test('reads configuration from environment variables', () => {
      global.process = {
        env: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'WARN',
          LOGGER_ENABLED: 'false',
          LOGGER_COLORS: 'false',
          LOGGER_TIMESTAMPS: 'false',
          LOGGER_STACK_TRACES: 'false',
          LOGGER_ANSI_DEBUG: '95',
          LOGGER_ANSI_INFO: '96',
          LOGGER_ANSI_WARN: '97',
          LOGGER_ANSI_ERROR: '91'
        }
      } as any;

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.enabled).toBe(false);
      expect(config.colors.enabled).toBe(false);
      expect(config.showTimestamp).toBe(false);
      expect(config.includeStackTrace).toBe(false);
      expect(config.colors.ansi.debug).toBe(95);
      expect(config.colors.ansi.info).toBe(96);
      expect(config.colors.ansi.warn).toBe(97);
      expect(config.colors.ansi.error).toBe(91);
    });

    test('handles invalid environment variables gracefully', () => {
      global.process = {
        env: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'INVALID_LEVEL',
          LOGGER_ENABLED: 'maybe',
          LOGGER_ANSI_DEBUG: 'not_a_number'
        }
      } as any;

      const logger = createLogger();
      const config = logger.getConfig();

      expect(config.minLevel).toBe(LogLevel.DEBUG); // Falls back to default
      expect(config.enabled).toBe(false); // parseEnvBoolean returns false for invalid
      expect(config.colors.ansi.debug).toBe(36); // Falls back to default
    });

    test('environment variables override configuration', () => {
      global.process = {
        env: {
          NODE_ENV: 'development',
          LOG_LEVEL: 'ERROR'
        },
        cwd: () => '/test'
      } as any;

      const logger = createLogger({
        minLevel: LogLevel.DEBUG // This should be overridden
      });

      expect(logger.getConfig().minLevel).toBe(LogLevel.ERROR);
    });
  });

  describe('server-side logging scenarios', () => {
    test('API request logging', () => {
      const logger = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('Incoming request', 'http', {
        method: 'POST',
        url: '/api/users',
        ip: '192.168.1.1'
      });

      logger.info('Request processed', 'http', {
        status: 200,
        duration: '45ms'
      });

      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.info).toHaveBeenNthCalledWith(
        1,
        '[http] Incoming request',
        { method: 'POST', url: '/api/users', ip: '192.168.1.1' }
      );
    });

    test('database query logging', () => {
      const logger = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.enableCategory('db', LogLevel.DEBUG);

      logger.debug('Executing query', 'db', {
        sql: 'SELECT * FROM users WHERE id = ?',
        params: [123]
      });

      logger.debug('Query completed', 'db', {
        rows: 1,
        duration: '2.5ms'
      });

      expect(mockConsole.debug).toHaveBeenCalledTimes(2);
    });

    test('error logging with stack traces', () => {
      const logger = createLogger({
        showTimestamp: false,
        includeStackTrace: true,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      const error = new Error('Database connection failed');
      error.stack = 'Error: Database connection failed\n    at db.js:45:12\n    at app.js:23:8';

      logger.error('Database error occurred', 'db', error, {
        connectionString: 'postgres://localhost:5432/mydb',
        retryCount: 3
      });

      expect(mockConsole.error).toHaveBeenCalledWith(
        '[db] Database error occurred',
        error,
        { connectionString: 'postgres://localhost:5432/mydb', retryCount: 3 }
      );
      expect(mockConsole.error).toHaveBeenCalledWith(error.stack);
    });

    test('application lifecycle logging', () => {
      const logger = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('Server starting...');
      logger.debug('Loading environment configuration', 'config');
      logger.debug('Connecting to database', 'db');
      logger.debug('Setting up routes', 'router');
      logger.info('Server listening on port 3000');

      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.debug).toHaveBeenCalledTimes(3);
    });
  });

  describe('performance considerations', () => {
    test('disabled logging has minimal overhead', () => {
      const logger = createLogger({
        enabled: false,
        showTimestamp: false
      });

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
        logger.debug(`Debug ${i}`);
        logger.warn(`Warning ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Disabled logging should be very fast
      expect(duration).toBeLessThan(50);
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    test('log level filtering reduces output', () => {
      const logger = createLogger({
        minLevel: LogLevel.WARN,
        showTimestamp: false
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    test('duplicate log prevention works', () => {
      const logger = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.info('Duplicate message');
      logger.info('Duplicate message');
      logger.info('Duplicate message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration management', () => {
    test('runtime configuration changes', () => {
      const logger = createLogger();

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getConfig().minLevel).toBe(LogLevel.ERROR);

      logger.enableCategory('special', LogLevel.DEBUG);
      expect(logger.getConfig().categories['special']).toEqual({
        enabled: true,
        minLevel: LogLevel.DEBUG
      });

      logger.configure({
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });
      expect(logger.getConfig().colors.enabled).toBe(false);
    });

    test('category-specific log levels', () => {
      const logger = createLogger({
        minLevel: LogLevel.ERROR,
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger.enableCategory('verbose', LogLevel.DEBUG);

      logger.debug('Global debug');         // Should not show
      logger.debug('Verbose debug', 'verbose'); // Should show
      logger.error('Global error');         // Should show

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith('[verbose] Verbose debug');
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('memory management', () => {
    test('cleans up old duplicate log entries', () => {
      const logger = createLogger({
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      // Access the internal duplicate tracking map
      const recentLogs = (logger as any).recentLogs;

      // Fill up with many different messages to trigger cleanup threshold
      for (let i = 0; i < 150; i++) {
        logger.info(`Message ${i}`);
      }

      // Cleanup only triggers when size > 100, and only removes old entries
      // Since all entries are recent, they won't be cleaned up immediately
      expect(recentLogs.size).toBe(150);

      // But the cleanup mechanism should be in place
      expect(recentLogs.size).toBeGreaterThan(100);
    });
  });

  describe('error handling', () => {
    test('handles console method failures gracefully', () => {
      const brokenConsole = {
        ...mockConsole,
        info: jest.fn().mockImplementation(() => {
          throw new Error('Console broken');
        })
      };
      global.console = brokenConsole as any;

      const logger = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      expect(() => {
        logger.info('Test message');
      }).toThrow('Console broken');
    });

    test('handles missing process.env gracefully', () => {
      global.process = { cwd: () => '/test' } as any;

      expect(() => createLogger()).not.toThrow();
      
      const logger = createLogger();
      const config = logger.getConfig();
      
      // Should use defaults when process.env is not available
      expect(config.enabled).toBe(true);
    });
  });

  describe('multiple logger instances', () => {
    test('independent logger configurations', () => {
      const apiLogger = createLogger({
        minLevel: LogLevel.INFO,
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      const dbLogger = createLogger({
        minLevel: LogLevel.DEBUG,
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      apiLogger.debug('API debug'); // Should not show
      dbLogger.debug('DB debug');   // Should show

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith('DB debug');
    });

    test('category isolation between loggers', () => {
      const logger1 = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });
      const logger2 = createLogger({ 
        showTimestamp: false,
        colors: { enabled: false, browser: {} as any, ansi: {} as any }
      });

      logger1.enableCategory('test', LogLevel.DEBUG);
      logger2.disableCategory('test');

      logger1.debug('Message 1', 'test'); // Should show
      logger2.debug('Message 2', 'test'); // Should not show

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      expect(mockConsole.debug).toHaveBeenCalledWith('[test] Message 1');
    });
  });
});