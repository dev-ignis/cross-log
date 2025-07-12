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
  runtime?: string;
}

// Logger interface that both browser and node loggers implement
export interface ILogger {
  debug(message: string, category?: string, ...args: unknown[]): void;
  info(message: string, category?: string, ...args: unknown[]): void;
  warn(message: string, category?: string, ...args: unknown[]): void;
  error(message: string | Error, category?: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  configure(config: PartialLoggerConfig): void;
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

/**
 * Deep partial type that makes all properties and nested properties optional
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Helper type for partial logger configuration with better inference
 */
export type PartialLoggerConfig = {
  enabled?: boolean;
  minLevel?: LogLevel;
  showTimestamp?: boolean;
  includeStackTrace?: boolean;
  categories?: Record<string, Partial<CategoryConfig>>;
  colors?: {
    enabled?: boolean;
    browser?: Partial<BrowserColorConfig>;
    ansi?: Partial<AnsiColorConfig>;
  };
  storage?: Partial<StorageConfig>;
  browserControls?: Partial<BrowserControlsConfig>;
};

/**
 * Type for log level values (string or enum)
 */
export type LogLevelValue = LogLevel | keyof typeof LogLevel;

/**
 * Type guard to check if a value is a valid LogLevel
 */
export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'number' && value >= LogLevel.DEBUG && value <= LogLevel.SILENT;
}

/**
 * Type guard to check if a value is a valid LogLevel string
 */
export function isLogLevelString(value: unknown): value is keyof typeof LogLevel {
  return typeof value === 'string' && value in LogLevel;
}

/**
 * Deep merge configuration objects
 */
export function mergeConfig(base: LoggerConfig, partial: PartialLoggerConfig): LoggerConfig {
  const result = { ...base };

  if (partial.enabled !== undefined) result.enabled = partial.enabled;
  if (partial.minLevel !== undefined) result.minLevel = partial.minLevel;
  if (partial.showTimestamp !== undefined) result.showTimestamp = partial.showTimestamp;
  if (partial.includeStackTrace !== undefined) result.includeStackTrace = partial.includeStackTrace;

  if (partial.categories) {
    result.categories = { ...base.categories };
    // Merge partial category configs
    for (const [key, value] of Object.entries(partial.categories)) {
      if (value) {
        result.categories[key] = {
          enabled: value.enabled ?? base.categories[key]?.enabled ?? true,
          minLevel: value.minLevel ?? base.categories[key]?.minLevel ?? LogLevel.DEBUG
        };
      }
    }
  }

  if (partial.colors) {
    result.colors = {
      enabled: partial.colors.enabled ?? base.colors.enabled,
      browser: partial.colors.browser ? { ...base.colors.browser, ...partial.colors.browser } : base.colors.browser,
      ansi: partial.colors.ansi ? { ...base.colors.ansi, ...partial.colors.ansi } : base.colors.ansi
    };
  }

  if (partial.storage) {
    result.storage = { ...base.storage, ...partial.storage };
  }

  if (partial.browserControls) {
    result.browserControls = { ...base.browserControls, ...partial.browserControls };
  }

  return result;
}
