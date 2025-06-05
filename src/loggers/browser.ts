/**
 * Browser-specific logger implementation
 */

import { BaseLogger } from './base';
import { LoggerConfig, LogLevel, LogEntry } from '../core/types';
import { getConsoleMethod } from '../core/utils';

// Window interface extension for TypeScript
interface WindowWithLogger {
  [key: string]: unknown;
}

export class BrowserLogger extends BaseLogger {
  private storageAvailable: boolean;

  constructor(initialConfig?: Partial<LoggerConfig>) {
    super(initialConfig);
    this.storageAvailable = this.checkStorageAvailability();
    this.loadConfigFromStorage();
    this.setupBrowserControls();
  }

  /**
   * Output log with browser-specific styling
   */
  protected outputLog(
    level: LogLevel,
    formattedMessage: string,
    _logEntry: LogEntry,
    ...args: unknown[]
  ): void {
    const config = this.configManager.getConfig();
    const consoleMethod = getConsoleMethod(level);

    if (config.colors.enabled) {
      const color = this.getColorForLevel(level);
      const style = `color: ${color}; font-weight: bold`;
      consoleMethod(`%c${formattedMessage}`, style, ...args);
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
   * Override configure to save to storage
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    super.configure(newConfig);
    this.saveConfigToStorage();
  }

  /**
   * Override setLevel to save to storage
   */
  setLevel(level: LogLevel): void {
    super.setLevel(level);
    this.saveConfigToStorage();
  }

  /**
   * Override enableCategory to save to storage
   */
  enableCategory(category: string, minLevel: LogLevel = LogLevel.DEBUG): void {
    super.enableCategory(category, minLevel);
    this.saveConfigToStorage();
  }

  /**
   * Override disableCategory to save to storage
   */
  disableCategory(category: string): void {
    super.disableCategory(category);
    this.saveConfigToStorage();
  }

  /**
   * Override enableAll to save to storage
   */
  enableAll(): void {
    super.enableAll();
    this.saveConfigToStorage();
  }

  /**
   * Override disableAll to save to storage
   */
  disableAll(): void {
    super.disableAll();
    this.saveConfigToStorage();
  }

  /**
   * Get color for log level
   */
  private getColorForLevel(level: LogLevel): string {
    const config = this.configManager.getConfig();
    const colors = config.colors.browser;

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

  /**
   * Check if localStorage is available
   */
  private checkStorageAvailability(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const testKey = '__logger_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfigFromStorage(): void {
    if (!this.storageAvailable) return;

    const config = this.configManager.getConfig();
    if (!config.storage.enabled) return;

    try {
      const configKey = `${config.storage.keyPrefix}_config`;
      const enabledKey = `${config.storage.keyPrefix}_enabled`;

      const savedConfig = localStorage.getItem(configKey);
      const savedEnabled = localStorage.getItem(enabledKey);

      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.configManager.updateConfig(parsedConfig);
      }

      if (savedEnabled !== null) {
        const enabled = savedEnabled === 'true';
        this.configManager.updateConfig({ enabled });
      }
    } catch (error) {
      console.error('Error loading logger config from localStorage:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfigToStorage(): void {
    if (!this.storageAvailable) return;

    const config = this.configManager.getConfig();
    if (!config.storage.enabled) return;

    try {
      const configKey = `${config.storage.keyPrefix}_config`;
      const enabledKey = `${config.storage.keyPrefix}_enabled`;

      localStorage.setItem(configKey, JSON.stringify(config));
      localStorage.setItem(enabledKey, config.enabled.toString());
    } catch (error) {
      console.error('Error saving logger config to localStorage:', error);
    }
  }

  /**
   * Setup browser console controls
   */
  private setupBrowserControls(): void {
    const config = this.configManager.getConfig();
    if (!config.browserControls.enabled || typeof window === 'undefined') {
      return;
    }

    const win = window as unknown as WindowWithLogger;
    const namespace = config.browserControls.windowNamespace;

    // Expose the logger instance
    win[namespace] = this;

    // Helper functions
    const enableFuncName = `enable${this.capitalizeFirst(namespace.replace('__', ''))}Logging`;
    const disableFuncName = `disable${this.capitalizeFirst(namespace.replace('__', ''))}Logging`;
    const statusFuncName = `${namespace.replace('__', '')}LoggingStatus`;

    win[enableFuncName] = () => {
      this.enableAll();
      console.log(
        `%cLogging enabled!`,
        `color: ${config.colors.browser.info}; font-size: 14px; font-weight: bold`
      );
      return `Logging enabled. Use ${namespace} to access the logger API.`;
    };

    win[disableFuncName] = () => {
      this.disableAll();
      console.log(
        `%cLogging disabled!`,
        `color: ${config.colors.browser.warn}; font-size: 14px; font-weight: bold`
      );
      return 'Logging disabled.';
    };

    win[statusFuncName] = () => {
      const currentConfig = this.getConfig();
      const status = currentConfig.enabled ? 'enabled' : 'disabled';
      console.log(
        `%cLogging is currently ${status}`,
        `color: ${config.colors.browser.info}; font-size: 14px;`
      );

      if (currentConfig.enabled) {
        console.log('Current configuration:', currentConfig);
      }

      return {
        enabled: currentConfig.enabled,
        config: currentConfig
      };
    };
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
