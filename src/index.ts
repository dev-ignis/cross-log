/**
 * Universal Logger - Main entry point
 * 
 * Automatically detects environment and provides appropriate logger implementation
 */

import { BrowserLogger } from './loggers/browser';
import { NodeLogger } from './loggers/node';
import { EdgeLogger } from './loggers/edge';
import { ILogger, PartialLoggerConfig } from './core/types';
import { detectRuntimeType, RuntimeType } from './core/environment';

/**
 * Create a logger instance with automatic environment detection
 */
export function createLogger(config?: PartialLoggerConfig): ILogger {
  const runtime = detectRuntimeType();
  
  switch (runtime) {
    case RuntimeType.BROWSER:
      return new BrowserLogger(config);
    case RuntimeType.EDGE:
      return new EdgeLogger(config);
    case RuntimeType.NODE:
    case RuntimeType.BUN:
      return new NodeLogger(config);
    case RuntimeType.DENO:
      // Deno can use Edge logger as it has similar restrictions
      return new EdgeLogger(config);
    default:
      // Fallback to edge logger for unknown environments (safest option)
      return new EdgeLogger(config);
  }
}

/**
 * Default logger instance
 */
const defaultLogger = createLogger();

// Export the default logger methods for convenience
export const debug = defaultLogger.debug.bind(defaultLogger);
export const info = defaultLogger.info.bind(defaultLogger);
export const warn = defaultLogger.warn.bind(defaultLogger);
export const error = defaultLogger.error.bind(defaultLogger);
export const setLevel = defaultLogger.setLevel.bind(defaultLogger);
export const configure = defaultLogger.configure.bind(defaultLogger);
export const enableCategory = defaultLogger.enableCategory.bind(defaultLogger);
export const disableCategory = defaultLogger.disableCategory.bind(defaultLogger);
export const enableAll = defaultLogger.enableAll.bind(defaultLogger);
export const disableAll = defaultLogger.disableAll.bind(defaultLogger);
export const getConfig = defaultLogger.getConfig.bind(defaultLogger);
export const isEnabled = defaultLogger.isEnabled.bind(defaultLogger);
export const Level = defaultLogger.Level;

// Named exports for specific environments
export { BrowserLogger } from './loggers/browser';
export { NodeLogger } from './loggers/node';
export { EdgeLogger } from './loggers/edge';
export { BaseLogger } from './loggers/base';

// Export types
export { 
  LogLevel, 
  LoggerConfig, 
  CategoryConfig, 
  ColorConfig,
  BrowserColorConfig,
  AnsiColorConfig,
  StorageConfig,
  BrowserControlsConfig,
  Environment,
  ILogger,
  LogEntry,
  EnvConfig,
  // Type utilities
  DeepPartial,
  PartialLoggerConfig,
  LogLevelValue,
  // Type guards and utilities
  isLogLevel,
  isLogLevelString,
  mergeConfig
} from './core/types';

// Export utilities
export { 
  detectEnvironment,
  parseLogLevel,
  parseEnvBoolean,
  parseEnvInt,
  formatTimestamp,
  isLoggingEnabled,
  formatMessage
} from './core/utils';

// Export environment utilities
export {
  detectRuntimeType,
  RuntimeType,
  getEnvironmentVariable,
  isProductionEnvironment,
  type RuntimeTypeValue
} from './core/environment';

// Export configuration manager
export { ConfigManager } from './core/config';

// Export plugins
export { 
  plugins,
  createApiPlugin,
  createDatabasePlugin,
  createAnalyticsPlugin,
  createPerformancePlugin,
  createSecurityPlugin,
  PluginManager,
  Plugin,
  PluginConfig,
  PluginContext,
  LoggerWithPlugins,
  ApiPlugin,
  DatabasePlugin,
  AnalyticsPlugin,
  PerformancePlugin,
  SecurityPlugin,
  ApiPluginConfig,
  DatabasePluginConfig,
  AnalyticsPluginConfig,
  PerformancePluginConfig,
  SecurityPluginConfig,
  WebVitalsMetrics,
  SecuritySeverity
} from './plugins';

// Default export
export default defaultLogger;
