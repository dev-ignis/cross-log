/**
 * Core types and interfaces for the universal logger
 */

// Log level definitions
export enum LogLevel {
  DEBUG = 0,   // Verbose information for debugging
  INFO = 1,    // General information
  WARN = 2,    // Warnings that don't affect functionality
  ERROR = 3,   // Errors that affect functionality
  SILENT = 4   // No logging
}

// Category-specific configuration
export interface CategoryConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

// Color configuration for different environments
export interface ColorConfig {
  enabled: boolean;
  browser: BrowserColorConfig;
  ansi: AnsiColorConfig;
}

export interface BrowserColorConfig {
  debug: string;
  info: string;
  warn: string;
  error: string;
}

export interface AnsiColorConfig {
  debug: number;
  info: number;
  warn: number;
  error: number;
}

// Storage configuration (browser only)
export interface StorageConfig {
  enabled: boolean;
  keyPrefix: string;
}

// Browser controls configuration
export interface BrowserControlsConfig {
  enabled: boolean;
  windowNamespace: string;
}

// Main logger configuration interface
export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  showTimestamp: boolean;
  includeStackTrace: boolean;
  categories: Record<string, CategoryConfig>;
  colors: ColorConfig;
  storage: StorageConfig;
  browserControls: BrowserControlsConfig;
}

// Environment detection interface
export interface Environment {
  isBrowser: boolean;
  isNode: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Logger interface that both browser and node loggers implement
export interface ILogger {
  debug(message: string, category?: string, ...args: unknown[]): void;
  info(message: string, category?: string, ...args: unknown[]): void;
  warn(message: string, category?: string, ...args: unknown[]): void;
  error(message: string | Error, category?: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  configure(config: Partial<LoggerConfig>): void;
  enableCategory(category: string, minLevel?: LogLevel): void;
  disableCategory(category: string): void;
  enableAll(): void;
  disableAll(): void;
  getConfig(): LoggerConfig;
  isEnabled(): boolean;
  Level: typeof LogLevel;
}

// Log entry interface for internal use
export interface LogEntry {
  level: LogLevel;
  message: string;
  category: string | undefined;
  timestamp: Date;
  args: unknown[];
}

// Environment variable configuration interface
export interface EnvConfig {
  LOG_LEVEL: string | undefined;
  LOGGER_ENABLED: string | undefined;
  LOGGER_TIMESTAMPS: string | undefined;
  LOGGER_STACK_TRACES: string | undefined;
  LOGGER_COLORS: string | undefined;
  LOGGER_STORAGE_ENABLED: string | undefined;
  LOGGER_STORAGE_KEY_PREFIX: string | undefined;
  LOGGER_BROWSER_CONTROLS: string | undefined;
  LOGGER_WINDOW_NAMESPACE: string | undefined;
  LOGGER_COLOR_DEBUG: string | undefined;
  LOGGER_COLOR_INFO: string | undefined;
  LOGGER_COLOR_WARN: string | undefined;
  LOGGER_COLOR_ERROR: string | undefined;
  LOGGER_ANSI_DEBUG: string | undefined;
  LOGGER_ANSI_INFO: string | undefined;
  LOGGER_ANSI_WARN: string | undefined;
  LOGGER_ANSI_ERROR: string | undefined;
}
