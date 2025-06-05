/**
 * Configuration manager with environment-based defaults
 */

import {
  LoggerConfig,
  LogLevel,
  Environment,
  EnvConfig
} from './types';
import {
  detectEnvironment,
  parseLogLevel,
  parseEnvBoolean,
  getEnvVar
} from './utils';

export class ConfigManager {
  private config: LoggerConfig;
  private environment: Environment;

  constructor(initialConfig?: Partial<LoggerConfig>) {
    this.environment = detectEnvironment();
    this.config = this.mergeWithDefaults(initialConfig);
  }

  /**
   * Get the current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Merge user config with smart defaults
   */
  private mergeWithDefaults(userConfig?: Partial<LoggerConfig>): LoggerConfig {
    const envConfig = this.getEnvConfig();

    // Base defaults without environment variables
    const baseDefaults: LoggerConfig = {
      enabled: true,
      minLevel: this.environment.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
      showTimestamp: true,
      includeStackTrace: true,
      categories: {},
      colors: {
        enabled: this.getDefaultColorsEnabled(),
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
      storage: {
        enabled: this.environment.isBrowser,
        keyPrefix: 'universal_logger'
      },
      browserControls: {
        enabled: this.environment.isBrowser && this.environment.isDevelopment,
        windowNamespace: '__universalLogger'
      }
    };

    // Environment variable overrides
    const envOverrides: Partial<LoggerConfig> = {};

    if (envConfig.LOGGER_ENABLED !== undefined) {
      envOverrides.enabled = parseEnvBoolean(envConfig.LOGGER_ENABLED, true);
    }

    if (envConfig.LOG_LEVEL !== undefined) {
      const envLevel = parseLogLevel(envConfig.LOG_LEVEL);
      if (envLevel !== null) {
        envOverrides.minLevel = envLevel;
      }
    }

    if (envConfig.LOGGER_TIMESTAMPS !== undefined) {
      envOverrides.showTimestamp = parseEnvBoolean(envConfig.LOGGER_TIMESTAMPS, true);
    }

    if (envConfig.LOGGER_STACK_TRACES !== undefined) {
      envOverrides.includeStackTrace = parseEnvBoolean(envConfig.LOGGER_STACK_TRACES, true);
    }

    // Handle colors configuration
    const colorsOverride: any = {};
    let hasColorOverrides = false;

    if (envConfig.LOGGER_COLORS !== undefined) {
      colorsOverride.enabled = parseEnvBoolean(envConfig.LOGGER_COLORS, this.getDefaultColorsEnabled());
      hasColorOverrides = true;
    }

    // Browser color overrides
    const browserColors: any = {};
    let hasBrowserColorOverrides = false;
    if (envConfig.LOGGER_COLOR_DEBUG) {
      browserColors.debug = envConfig.LOGGER_COLOR_DEBUG;
      hasBrowserColorOverrides = true;
    }
    if (envConfig.LOGGER_COLOR_INFO) {
      browserColors.info = envConfig.LOGGER_COLOR_INFO;
      hasBrowserColorOverrides = true;
    }
    if (envConfig.LOGGER_COLOR_WARN) {
      browserColors.warn = envConfig.LOGGER_COLOR_WARN;
      hasBrowserColorOverrides = true;
    }
    if (envConfig.LOGGER_COLOR_ERROR) {
      browserColors.error = envConfig.LOGGER_COLOR_ERROR;
      hasBrowserColorOverrides = true;
    }

    // ANSI color overrides
    const ansiColors: any = {};
    let hasAnsiColorOverrides = false;
    if (envConfig.LOGGER_ANSI_DEBUG) {
      const parsed = parseInt(envConfig.LOGGER_ANSI_DEBUG, 10);
      if (!isNaN(parsed)) {
        ansiColors.debug = parsed;
        hasAnsiColorOverrides = true;
      }
    }
    if (envConfig.LOGGER_ANSI_INFO) {
      const parsed = parseInt(envConfig.LOGGER_ANSI_INFO, 10);
      if (!isNaN(parsed)) {
        ansiColors.info = parsed;
        hasAnsiColorOverrides = true;
      }
    }
    if (envConfig.LOGGER_ANSI_WARN) {
      const parsed = parseInt(envConfig.LOGGER_ANSI_WARN, 10);
      if (!isNaN(parsed)) {
        ansiColors.warn = parsed;
        hasAnsiColorOverrides = true;
      }
    }
    if (envConfig.LOGGER_ANSI_ERROR) {
      const parsed = parseInt(envConfig.LOGGER_ANSI_ERROR, 10);
      if (!isNaN(parsed)) {
        ansiColors.error = parsed;
        hasAnsiColorOverrides = true;
      }
    }

    if (hasColorOverrides || hasBrowserColorOverrides || hasAnsiColorOverrides) {
      envOverrides.colors = {
        ...baseDefaults.colors,
        ...colorsOverride,
        browser: hasBrowserColorOverrides ? { ...baseDefaults.colors.browser, ...browserColors } : baseDefaults.colors.browser,
        ansi: hasAnsiColorOverrides ? { ...baseDefaults.colors.ansi, ...ansiColors } : baseDefaults.colors.ansi
      };
    }

    // Storage overrides
    const storageOverride: any = {};
    let hasStorageOverrides = false;
    if (envConfig.LOGGER_STORAGE_ENABLED !== undefined) {
      storageOverride.enabled = parseEnvBoolean(envConfig.LOGGER_STORAGE_ENABLED, this.environment.isBrowser);
      hasStorageOverrides = true;
    }
    if (envConfig.LOGGER_STORAGE_KEY_PREFIX) {
      storageOverride.keyPrefix = envConfig.LOGGER_STORAGE_KEY_PREFIX;
      hasStorageOverrides = true;
    }
    if (hasStorageOverrides) {
      envOverrides.storage = { ...baseDefaults.storage, ...storageOverride };
    }

    // Browser controls overrides
    const browserControlsOverride: any = {};
    let hasBrowserControlsOverrides = false;
    if (envConfig.LOGGER_BROWSER_CONTROLS !== undefined) {
      browserControlsOverride.enabled = parseEnvBoolean(envConfig.LOGGER_BROWSER_CONTROLS, this.environment.isBrowser && this.environment.isDevelopment);
      hasBrowserControlsOverrides = true;
    }
    if (envConfig.LOGGER_WINDOW_NAMESPACE) {
      browserControlsOverride.windowNamespace = envConfig.LOGGER_WINDOW_NAMESPACE;
      hasBrowserControlsOverrides = true;
    }
    if (hasBrowserControlsOverrides) {
      envOverrides.browserControls = { ...baseDefaults.browserControls, ...browserControlsOverride };
    }

    // Merge: base defaults < user config < environment variables
    return { ...baseDefaults, ...userConfig, ...envOverrides };
  }

  /**
   * Get environment configuration
   */
  private getEnvConfig(): EnvConfig {
    return {
      LOG_LEVEL: getEnvVar('LOG_LEVEL'),
      LOGGER_ENABLED: getEnvVar('LOGGER_ENABLED'),
      LOGGER_TIMESTAMPS: getEnvVar('LOGGER_TIMESTAMPS'),
      LOGGER_STACK_TRACES: getEnvVar('LOGGER_STACK_TRACES'),
      LOGGER_COLORS: getEnvVar('LOGGER_COLORS'),
      LOGGER_STORAGE_ENABLED: getEnvVar('LOGGER_STORAGE_ENABLED'),
      LOGGER_STORAGE_KEY_PREFIX: getEnvVar('LOGGER_STORAGE_KEY_PREFIX'),
      LOGGER_BROWSER_CONTROLS: getEnvVar('LOGGER_BROWSER_CONTROLS'),
      LOGGER_WINDOW_NAMESPACE: getEnvVar('LOGGER_WINDOW_NAMESPACE'),
      LOGGER_COLOR_DEBUG: getEnvVar('LOGGER_COLOR_DEBUG'),
      LOGGER_COLOR_INFO: getEnvVar('LOGGER_COLOR_INFO'),
      LOGGER_COLOR_WARN: getEnvVar('LOGGER_COLOR_WARN'),
      LOGGER_COLOR_ERROR: getEnvVar('LOGGER_COLOR_ERROR'),
      LOGGER_ANSI_DEBUG: getEnvVar('LOGGER_ANSI_DEBUG'),
      LOGGER_ANSI_INFO: getEnvVar('LOGGER_ANSI_INFO'),
      LOGGER_ANSI_WARN: getEnvVar('LOGGER_ANSI_WARN'),
      LOGGER_ANSI_ERROR: getEnvVar('LOGGER_ANSI_ERROR')
    };
  }



  /**
   * Get default colors enabled setting
   */
  private getDefaultColorsEnabled(): boolean {
    // Colors enabled in browser, or Node.js development
    return this.environment.isBrowser || this.environment.isDevelopment;
  }

  /**
   * Get environment information
   */
  getEnvironment(): Environment {
    return { ...this.environment };
  }
}
