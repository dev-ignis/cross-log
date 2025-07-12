/**
 * Next.js adapter for universal-logger
 * Entry point: universal-logger/next
 * 
 * Automatically detects Next.js environment (Edge Runtime vs Node.js)
 */

import { createLogger as createNodeLogger } from '../loggers/node';
import { createEdgeLogger } from '../loggers/edge';
import { LogLevel, LoggerConfig, ILogger } from '../core/types';
import { loadConfigFromEnv } from '../core/config';
import { detectRuntimeType, RuntimeType } from '../core/environment';

/**
 * Create a Next.js-optimized logger
 * Automatically detects Edge Runtime vs Node.js runtime
 */
export function createNextLogger(config?: Partial<LoggerConfig>): ILogger {
  const runtime = detectRuntimeType();
  const mergedConfig = {
    ...loadConfigFromEnv(),
    ...config
  };

  // In Next.js Edge Runtime (middleware, edge API routes)
  if (runtime === RuntimeType.EDGE) {
    return createEdgeLogger(mergedConfig);
  }

  // In Next.js Node.js runtime (regular API routes, SSR)
  return createNodeLogger(mergedConfig);
}

// Create a singleton logger instance
const nextLogger = createNextLogger();

// Export the logger instance and utilities
export default nextLogger;
export { nextLogger as logger };
export { LogLevel };
export type { LoggerConfig, ILogger };


// Re-export environment utilities
export { 
  detectEnvironment,
  getEnvironmentVariable,
  isProductionEnvironment,
  detectRuntimeType,
  RuntimeType,
  type RuntimeTypeValue
} from '../core/environment';