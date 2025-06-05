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
  parseEnvInt, 
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
    
    const defaults: LoggerConfig = {
      enabled: parseEnvBoolean(envConfig.LOGGER_ENABLED, true),
      minLevel: this.getDefaultLogLevel(envConfig),
      showTimestamp: parseEnvBoolean(envConfig.LOGGER_TIMESTAMPS, true),
      includeStackTrace: parseEnvBoolean(envConfig.LOGGER_STACK_TRACES, true),
      categories: {},
      colors: {
        enabled: parseEnvBoolean(envConfig.LOGGER_COLORS, this.getDefaultColorsEnabled()),
        browser: {
          debug: envConfig.LOGGER_COLOR_DEBUG || '#6EC1E4',
          info: envConfig.LOGGER_COLOR_INFO || '#4A9FCA',
          warn: envConfig.LOGGER_COLOR_WARN || '#FBC02D',
          error: envConfig.LOGGER_COLOR_ERROR || '#D67C2A'
        },
        ansi: {
          debug: parseEnvInt(envConfig.LOGGER_ANSI_DEBUG, 36),
          info: parseEnvInt(envConfig.LOGGER_ANSI_INFO, 36),
          warn: parseEnvInt(envConfig.LOGGER_ANSI_WARN, 33),
          error: parseEnvInt(envConfig.LOGGER_ANSI_ERROR, 31)
        }
      },
      storage: {
        enabled: parseEnvBoolean(
          envConfig.LOGGER_STORAGE_ENABLED, 
          this.environment.isBrowser
        ),
        keyPrefix: envConfig.LOGGER_STORAGE_KEY_PREFIX || 'universal_logger'
      },
      browserControls: {
        enabled: parseEnvBoolean(
          envConfig.LOGGER_BROWSER_CONTROLS,
          this.environment.isBrowser && this.environment.isDevelopment
        ),
        windowNamespace: envConfig.LOGGER_WINDOW_NAMESPACE || '__universalLogger'
      }
    };

    return { ...defaults, ...userConfig };
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
   * Get default log level based on environment
   */
  private getDefaultLogLevel(envConfig: EnvConfig): LogLevel {
    const envLevel = parseLogLevel(envConfig.LOG_LEVEL);
    if (envLevel !== null) {
      return envLevel;
    }

    // Smart default: DEBUG in development, WARN in production
    return this.environment.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
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
