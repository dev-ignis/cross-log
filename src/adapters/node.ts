/**
 * Node.js adapter for universal-logger
 * Entry point: universal-logger/node
 * 
 * Full Node.js features including file system, process APIs, etc.
 */

import { createLogger as createNodeLogger } from '../loggers/node';
import { LogLevel, LoggerConfig } from '../core/types';
import { loadConfigFromEnv } from '../core/config';

// Create a singleton logger instance for Node.js
const nodeLogger = createNodeLogger(loadConfigFromEnv());

// Export the logger instance and utilities
export default nodeLogger;
export { nodeLogger as logger };
export { LogLevel };
export type { LoggerConfig };

// Export factory function for creating custom instances
export { createLogger as createNodeLogger } from '../loggers/node';

// Export Node.js specific utilities
export { 
  detectEnvironment,
  getEnvironmentVariable,
  isProductionEnvironment
} from '../core/environment';

