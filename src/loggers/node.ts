/**
 * Node.js-specific logger implementation
 */

import { BaseLogger } from './base';
import { LoggerConfig, LogLevel, LogEntry } from '../core/types';
import { createAnsiColor, resetAnsiColor } from '../core/utils';

export class NodeLogger extends BaseLogger {
  private originalConsole: {
    debug: typeof console.debug;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    log: typeof console.log;
  };

  constructor(initialConfig?: Partial<LoggerConfig>) {
    super(initialConfig);

    // Store references to original console methods to prevent infinite recursion
    this.originalConsole = {
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      log: console.log.bind(console)
    };
  }

  /**
   * Output log with Node.js-specific ANSI coloring
   */
  protected outputLog(
    level: LogLevel,
    formattedMessage: string,
    _logEntry: LogEntry,
    ...args: unknown[]
  ): void {
    const config = this.configManager.getConfig();

    // Get the original console method to avoid infinite recursion
    // when logger methods are used to replace console methods
    const originalConsole = this.getOriginalConsoleMethod(level);

    if (config.colors.enabled) {
      const colorCode = this.getAnsiColorForLevel(level);
      const colorStart = createAnsiColor(colorCode);
      const colorEnd = resetAnsiColor();
      originalConsole(`${colorStart}${formattedMessage}${colorEnd}`, ...args);
    } else {
      originalConsole(formattedMessage, ...args);
    }
  }

  /**
   * Output stack trace for errors
   */
  protected outputStackTrace(error: Error): void {
    if (error.stack) {
      // Use original console.error to avoid infinite recursion
      const originalError = this.getOriginalConsoleMethod(LogLevel.ERROR);
      originalError(error.stack);
    }
  }

  /**
   * Get original console method to avoid infinite recursion
   */
  private getOriginalConsoleMethod(level: LogLevel): (message?: unknown, ...optionalParams: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return this.originalConsole.debug;
      case LogLevel.INFO:
        return this.originalConsole.info;
      case LogLevel.WARN:
        return this.originalConsole.warn;
      case LogLevel.ERROR:
        return this.originalConsole.error;
      default:
        return this.originalConsole.log;
    }
  }

  /**
   * Get ANSI color code for log level
   */
  private getAnsiColorForLevel(level: LogLevel): number {
    const config = this.configManager.getConfig();
    const colors = config.colors.ansi;

    switch (level) {
      case LogLevel.DEBUG:
        return colors.debug;
      case LogLevel.INFO:
        return colors.info;
      case LogLevel.WARN:
        return colors.warn;
      case LogLevel.ERROR:
        return colors.error;
      default:
        return colors.info;
    }
  }
}
