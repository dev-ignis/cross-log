/**
 * Utility functions for the universal logger
 */

import { LogLevel, Environment } from './types';

/**
 * Detect the current environment
 */
export function detectEnvironment(): Environment {
  const isBrowser = typeof window !== 'undefined';
  const isNode = !isBrowser && typeof process !== 'undefined';
  const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
  const isProduction = !isDevelopment;

  return {
    isBrowser,
    isNode,
    isDevelopment,
    isProduction
  };
}

/**
 * Parse log level from string
 */
export function parseLogLevel(level?: string): LogLevel | null {
  if (!level) return null;
  
  const upperLevel = level.toUpperCase();
  switch (upperLevel) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'SILENT': return LogLevel.SILENT;
    default: return null;
  }
}

/**
 * Parse boolean from environment variable
 */
export function parseEnvBoolean(value?: string, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer from environment variable
 */
export function parseEnvInt(value?: string, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

/**
 * Format timestamp for logging
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Check if logging should be enabled for the specified level
 */
export function isLoggingEnabled(
  currentLevel: LogLevel, 
  messageLevel: LogLevel, 
  globalEnabled: boolean
): boolean {
  return globalEnabled && messageLevel >= currentLevel && currentLevel < LogLevel.SILENT;
}

/**
 * Format message with category and timestamp
 */
export function formatMessage(
  message: string, 
  category?: string, 
  showTimestamp: boolean = true
): string {
  const parts: string[] = [];
  
  if (showTimestamp) {
    parts.push(`[${formatTimestamp()}]`);
  }
  
  if (category) {
    parts.push(`[${category}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Get console method for log level
 */
export function getConsoleMethod(level: LogLevel): (message?: unknown, ...optionalParams: unknown[]) => void {
  switch (level) {
    case LogLevel.DEBUG:
      return console.debug;
    case LogLevel.INFO:
      return console.info;
    case LogLevel.WARN:
      return console.warn;
    case LogLevel.ERROR:
      return console.error;
    default:
      return console.log;
  }
}

/**
 * Create ANSI color code for terminal output
 */
export function createAnsiColor(colorCode: number): string {
  return `\x1b[${colorCode}m`;
}

/**
 * Reset ANSI color
 */
export function resetAnsiColor(): string {
  return '\x1b[0m';
}

/**
 * Safely stringify an object for logging
 */
export function safeStringify(obj: unknown): string {
  try {
    if (typeof obj === 'string') return obj;
    if (obj instanceof Error) return obj.message;
    return JSON.stringify(obj, null, 2);
  } catch {
    return '[Circular or non-serializable object]';
  }
}

/**
 * Debounce function to prevent log spam
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | number | undefined;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = undefined;
      func(...args);
    };
    
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
