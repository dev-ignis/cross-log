/**
 * Edge Runtime adapter for universal-logger
 * Entry point: universal-logger/edge
 */

import { createEdgeLogger } from '../loggers/edge';
import { LogLevel, LoggerConfig } from '../core/types';
import { loadConfigFromEnv } from '../core/config';

// Create a singleton logger instance for Edge Runtime
const edgeLogger = createEdgeLogger(loadConfigFromEnv());

// Export the logger instance and utilities
export default edgeLogger;
export { edgeLogger as logger };
export { LogLevel };
export type { LoggerConfig };

// Export factory function for creating custom instances
export { createEdgeLogger } from '../loggers/edge';

// Re-export core utilities that are Edge-safe
export { 
  detectEnvironment,
  getEnvironmentVariable,
  isProductionEnvironment,
  detectRuntimeType,
  RuntimeType,
  type RuntimeTypeValue
} from '../core/environment';