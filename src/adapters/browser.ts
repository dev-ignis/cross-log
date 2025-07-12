/**
 * Browser adapter for universal-logger
 * Entry point: universal-logger/browser
 * 
 * Optimized for browser environments with localStorage support
 */

import { createLogger as createBrowserLogger } from '../loggers/browser';
import { LogLevel, LoggerConfig } from '../core/types';
import { loadConfigFromEnv } from '../core/config';

// Create a singleton logger instance for browsers
const browserLogger = createBrowserLogger(loadConfigFromEnv());

// Export the logger instance and utilities
export default browserLogger;
export { browserLogger as logger };
export { LogLevel };
export type { LoggerConfig };

// Export factory function for creating custom instances
export { createLogger as createBrowserLogger } from '../loggers/browser';

// Export browser-safe utilities
export { 
  detectEnvironment,
  getEnvironmentVariable,
  isProductionEnvironment
} from '../core/environment';