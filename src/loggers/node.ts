/**
 * Node.js-specific logger implementation
 */

import { BaseLogger } from './base';
import { LoggerConfig, LogLevel, LogEntry } from '../core/types';
import { getConsoleMethod, createAnsiColor, resetAnsiColor } from '../core/utils';

export class NodeLogger extends BaseLogger {
  constructor(initialConfig?: Partial<LoggerConfig>) {
    super(initialConfig);
  }

  /**
   * Output log with Node.js-specific ANSI coloring
   */
  protected outputLog(
    level: LogLevel,
    formattedMessage: string,
    logEntry: LogEntry,
    ...args: unknown[]
  ): void {
    const config = this.configManager.getConfig();
    const consoleMethod = getConsoleMethod(level);

    if (config.colors.enabled) {
      const colorCode = this.getAnsiColorForLevel(level);
      const colorStart = createAnsiColor(colorCode);
      const colorEnd = resetAnsiColor();
      consoleMethod(`${colorStart}${formattedMessage}${colorEnd}`, ...args);
    } else {
      consoleMethod(formattedMessage, ...args);
    }
  }

  /**
   * Output stack trace for errors
   */
  protected outputStackTrace(error: Error): void {
    if (error.stack) {
      console.error(error.stack);
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
