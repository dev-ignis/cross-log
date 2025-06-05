/**
 * Base logger implementation with shared functionality
 */

import { 
  ILogger, 
  LoggerConfig, 
  LogLevel, 
  LogEntry 
} from '../core/types';
import { ConfigManager } from '../core/config';
import { 
  isLoggingEnabled, 
  formatMessage
} from '../core/utils';

export abstract class BaseLogger implements ILogger {
  protected configManager: ConfigManager;
  protected recentLogs: Map<string, number> = new Map();
  protected readonly duplicateThreshold = 1000; // ms

  constructor(initialConfig?: Partial<LoggerConfig>) {
    this.configManager = new ConfigManager(initialConfig);
  }

  /**
   * Log debug message
   */
  debug(message: string, category?: string, ...args: unknown[]): void {
    this.logWithLevel(LogLevel.DEBUG, message, category, ...args);
  }

  /**
   * Log informational message
   */
  info(message: string, category?: string, ...args: unknown[]): void {
    this.logWithLevel(LogLevel.INFO, message, category, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, category?: string, ...args: unknown[]): void {
    this.logWithLevel(LogLevel.WARN, message, category, ...args);
  }

  /**
   * Log error message or Error object
   */
  error(message: string | Error, category?: string, ...args: unknown[]): void {
    this.logWithLevel(LogLevel.ERROR, message, category, ...args);
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    const config = this.configManager.getConfig();
    this.configManager.updateConfig({ ...config, minLevel: level });
  }

  /**
   * Configure the logger
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    this.configManager.updateConfig(newConfig);
  }

  /**
   * Enable logging for a specific category
   */
  enableCategory(category: string, minLevel: LogLevel = LogLevel.DEBUG): void {
    const config = this.configManager.getConfig();
    config.categories[category] = { enabled: true, minLevel };
    this.configManager.updateConfig(config);
  }

  /**
   * Disable logging for a specific category
   */
  disableCategory(category: string): void {
    const config = this.configManager.getConfig();
    if (config.categories[category]) {
      config.categories[category].enabled = false;
    } else {
      config.categories[category] = { enabled: false, minLevel: LogLevel.DEBUG };
    }
    this.configManager.updateConfig(config);
  }

  /**
   * Enable all logging
   */
  enableAll(): void {
    const config = this.configManager.getConfig();
    config.enabled = true;
    config.minLevel = LogLevel.DEBUG;
    
    // Enable all existing categories
    Object.keys(config.categories).forEach(category => {
      config.categories[category]!.enabled = true;
    });
    
    this.configManager.updateConfig(config);
  }

  /**
   * Disable all logging
   */
  disableAll(): void {
    const config = this.configManager.getConfig();
    config.enabled = false;
    this.configManager.updateConfig(config);
  }

  /**
   * Get the current logger configuration
   */
  getConfig(): LoggerConfig {
    return this.configManager.getConfig();
  }

  /**
   * Check if logging is currently enabled
   */
  isEnabled(): boolean {
    return this.configManager.getConfig().enabled;
  }

  /**
   * Log level constants
   */
  get Level(): typeof LogLevel {
    return LogLevel;
  }

  /**
   * Core logging method with level checking
   */
  protected logWithLevel(
    level: LogLevel,
    message: string | Error,
    category?: string,
    ...args: unknown[]
  ): void {
    const config = this.configManager.getConfig();

    // Check if logging is globally enabled
    if (!config.enabled) return;

    // Check category-specific settings first
    if (category && config.categories[category]) {
      const categoryConfig = config.categories[category]!;
      if (!categoryConfig.enabled) return;
      if (!isLoggingEnabled(categoryConfig.minLevel, level, true)) return;
    } else {
      // Check global log level only if no category-specific settings
      if (!isLoggingEnabled(config.minLevel, level, true)) return;
    }

    // Check for duplicate logs
    if (this.isDuplicateLog(message, category)) return;

    // Create log entry
    const logEntry: LogEntry = {
      level,
      message: typeof message === 'string' ? message : message.message,
      category,
      timestamp: new Date(),
      args
    };

    // Format message
    const formattedMessage = formatMessage(
      logEntry.message,
      category,
      config.showTimestamp
    );

    // Output the log
    this.outputLog(level, formattedMessage, logEntry, ...args);

    // Handle error stack traces
    if (level === LogLevel.ERROR && message instanceof Error && config.includeStackTrace) {
      this.outputStackTrace(message);
    }
  }

  /**
   * Check if this is a duplicate log message
   */
  protected isDuplicateLog(message: string | Error, category?: string): boolean {
    const key = `${typeof message === 'string' ? message : message.message}:${category || ''}`;
    const now = Date.now();
    const lastTime = this.recentLogs.get(key);

    if (lastTime && (now - lastTime) < this.duplicateThreshold) {
      return true;
    }

    this.recentLogs.set(key, now);
    
    // Clean up old entries
    if (this.recentLogs.size > 100) {
      const cutoff = now - this.duplicateThreshold * 2;
      for (const [k, time] of this.recentLogs.entries()) {
        if (time < cutoff) {
          this.recentLogs.delete(k);
        }
      }
    }

    return false;
  }

  /**
   * Abstract method for outputting logs (implemented by subclasses)
   */
  protected abstract outputLog(
    level: LogLevel,
    formattedMessage: string,
    logEntry: LogEntry,
    ...args: unknown[]
  ): void;

  /**
   * Abstract method for outputting stack traces (implemented by subclasses)
   */
  protected abstract outputStackTrace(error: Error): void;
}
