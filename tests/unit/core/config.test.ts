/**
 * Unit tests for ConfigManager
 */

import { ConfigManager } from '../../../src/core/config';
import { LogLevel } from '../../../src/core/types';

describe('ConfigManager', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;
  const originalProcess = global.process;

  beforeEach(() => {
    process.env = { ...originalEnv };
    global.window = originalWindow;
    global.process = originalProcess;
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
    global.process = originalProcess;
  });

  describe('default configuration', () => {
    test('creates default config for development environment', () => {
      process.env.NODE_ENV = 'development';
      delete (global as any).window;

      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.minLevel).toBe(LogLevel.DEBUG);
      expect(config.showTimestamp).toBe(true);
      expect(config.includeStackTrace).toBe(true);
      expect(config.colors.enabled).toBe(true);
      expect(config.storage.enabled).toBe(false);
      expect(config.browserControls.enabled).toBe(false);
    });

    test('creates default config for production environment', () => {
      process.env.NODE_ENV = 'production';
      delete (global as any).window;

      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.enabled).toBe(true);
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.colors.enabled).toBe(false);
    });

    test('creates default config for browser environment', () => {
      global.window = {} as any;
      process.env.NODE_ENV = 'development';

      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.storage.enabled).toBe(true);
      expect(config.browserControls.enabled).toBe(true);
      expect(config.colors.enabled).toBe(true);
    });
  });

  describe('environment variable configuration', () => {
    test('respects LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'ERROR';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.minLevel).toBe(LogLevel.ERROR);
    });

    test('respects LOGGER_ENABLED environment variable', () => {
      process.env.LOGGER_ENABLED = 'false';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.enabled).toBe(false);
    });

    test('respects color configuration environment variables', () => {
      process.env.LOGGER_COLORS = 'false';
      process.env.LOGGER_COLOR_DEBUG = '#FF0000';
      process.env.LOGGER_ANSI_DEBUG = '91';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.colors.enabled).toBe(false);
      expect(config.colors.browser.debug).toBe('#FF0000');
      expect(config.colors.ansi.debug).toBe(91);
    });

    test('respects storage configuration environment variables', () => {
      process.env.LOGGER_STORAGE_ENABLED = 'false';
      process.env.LOGGER_STORAGE_KEY_PREFIX = 'my_app';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.storage.keyPrefix).toBe('my_app');
    });

    test('respects browser controls environment variables', () => {
      process.env.LOGGER_BROWSER_CONTROLS = 'false';
      process.env.LOGGER_WINDOW_NAMESPACE = '__myLogger';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.browserControls.windowNamespace).toBe('__myLogger');
    });
  });

  describe('user configuration override', () => {
    test('merges user config with defaults', () => {
      const userConfig = {
        enabled: false,
        minLevel: LogLevel.ERROR,
        showTimestamp: false
      };

      const configManager = new ConfigManager(userConfig);
      const config = configManager.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.minLevel).toBe(LogLevel.ERROR);
      expect(config.showTimestamp).toBe(false);
      expect(config.includeStackTrace).toBe(true); // Default value
    });

    test('allows partial configuration updates', () => {
      const configManager = new ConfigManager();
      
      configManager.updateConfig({
        minLevel: LogLevel.WARN,
        colors: {
          enabled: false,
          browser: {
            debug: '#000000',
            info: '#111111',
            warn: '#222222',
            error: '#333333'
          },
          ansi: {
            debug: 30,
            info: 31,
            warn: 32,
            error: 33
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.minLevel).toBe(LogLevel.WARN);
      expect(config.colors.enabled).toBe(false);
      expect(config.enabled).toBe(true); // Should preserve other values
    });
  });

  describe('environment detection', () => {
    test('provides environment information', () => {
      delete (global as any).window;
      process.env.NODE_ENV = 'development';

      const configManager = new ConfigManager();
      const env = configManager.getEnvironment();

      expect(env.isBrowser).toBe(false);
      expect(env.isNode).toBe(true);
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
    });
  });

  describe('configuration immutability', () => {
    test('returns a copy of configuration', () => {
      const configManager = new ConfigManager();
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects

      config1.enabled = false;
      expect(configManager.getConfig().enabled).toBe(true); // Original unchanged
    });

    test('returns a copy of environment information', () => {
      const configManager = new ConfigManager();
      const env1 = configManager.getEnvironment();
      const env2 = configManager.getEnvironment();

      expect(env1).toEqual(env2);
      expect(env1).not.toBe(env2); // Different objects
    });
  });

  describe('invalid environment variables', () => {
    test('handles invalid LOG_LEVEL gracefully', () => {
      process.env.LOG_LEVEL = 'INVALID_LEVEL';
      process.env.NODE_ENV = 'development';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.minLevel).toBe(LogLevel.DEBUG); // Falls back to default
    });

    test('handles invalid numeric values gracefully', () => {
      process.env.LOGGER_ANSI_DEBUG = 'not_a_number';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.colors.ansi.debug).toBe(36); // Falls back to default
    });

    test('handles invalid boolean values gracefully', () => {
      process.env.LOGGER_ENABLED = 'maybe';
      
      const configManager = new ConfigManager();
      const config = configManager.getConfig();

      expect(config.enabled).toBe(false); // parseEnvBoolean defaults to false for invalid values
    });
  });
});