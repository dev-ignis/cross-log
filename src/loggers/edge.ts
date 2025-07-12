/**
 * Edge Runtime logger implementation
 * Compatible with Vercel Edge Functions, Cloudflare Workers, and other Edge Runtimes
 */

import { BaseLogger } from './base';
import { LogLevel, LoggerConfig, LogEntry } from '../core/types';
import { getConsoleMethod } from '../core/utils';

/**
 * Edge-specific logger that works in Edge Runtime environments
 * Uses only Web APIs and avoids Node.js-specific features
 */
export class EdgeLogger extends BaseLogger {
  constructor(config?: Partial<LoggerConfig>) {
    // Apply Edge-specific defaults before passing to parent
    const edgeConfig = config ? {
      ...config,
      storage: {
        enabled: false,
        keyPrefix: config.storage?.keyPrefix || 'logger_'
      },
      browserControls: {
        enabled: false,
        windowNamespace: config.browserControls?.windowNamespace || 'logger'
      }
    } : undefined;
    
    super(edgeConfig);
  }

  /**
   * Output log implementation for Edge Runtime
   * Uses console methods which are available in Edge environments
   */
  protected outputLog(
    level: LogLevel,
    formattedMessage: string,
    _logEntry: LogEntry,
    ...args: unknown[]
  ): void {
    const consoleMethod = getConsoleMethod(level);

    // Edge runtimes support console methods
    if (args.length > 0) {
      consoleMethod(formattedMessage, ...args);
    } else {
      consoleMethod(formattedMessage);
    }
  }

  /**
   * Output stack trace for Edge Runtime
   * Limited stack trace support in Edge environments
   */
  protected outputStackTrace(error: Error): void {
    if (error.stack) {
      console.error(error.stack);
    }
  }


  /**
   * Edge-specific configuration
   * Disables features not available in Edge Runtime
   */
  public configure(config: Partial<LoggerConfig>): void {
    // Disable features not available in Edge Runtime
    const edgeConfig = {
      ...config,
      // Storage is not available in Edge Runtime
      storage: {
        enabled: false,
        keyPrefix: config.storage?.keyPrefix || 'logger_'
      },
      // Browser controls are not applicable
      browserControls: {
        enabled: false,
        windowNamespace: config.browserControls?.windowNamespace || 'logger'
      }
    };

    super.configure(edgeConfig);
  }
}

/**
 * Factory function to create an Edge logger instance
 */
export function createEdgeLogger(config?: Partial<LoggerConfig>): EdgeLogger {
  return new EdgeLogger(config);
}