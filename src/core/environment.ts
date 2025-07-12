/**
 * Environment abstraction layer for cross-platform compatibility
 * Handles differences between Node.js, Browser, and Edge Runtime environments
 */

import { Environment } from './types';

/**
 * Runtime type detection
 */
export const RuntimeType = {
  BROWSER: 'browser',
  NODE: 'node',
  EDGE: 'edge',
  DENO: 'deno',
  BUN: 'bun',
  UNKNOWN: 'unknown'
} as const;

export type RuntimeTypeValue = typeof RuntimeType[keyof typeof RuntimeType];

/**
 * Detect the current runtime type
 */
export function detectRuntimeType(): RuntimeTypeValue {
  // Browser detection
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return RuntimeType.BROWSER;
  }

  // Deno detection
  if (typeof (globalThis as any).Deno !== 'undefined') {
    return RuntimeType.DENO;
  }

  // Bun detection
  if (typeof (globalThis as any).Bun !== 'undefined') {
    return RuntimeType.BUN;
  }

  // Node.js detection (check this before Edge Runtime)
  if (typeof process !== 'undefined' && 
      process.versions && 
      process.versions.node) {
    return RuntimeType.NODE;
  }

  // Edge Runtime detection (Vercel Edge, Cloudflare Workers, etc.)
  // Edge runtimes have specific globals and no process.versions
  // Check for Edge-specific APIs or runtime indicators
  if (typeof (globalThis as any).process === 'undefined') {
    // Vercel Edge Runtime
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
      return RuntimeType.EDGE;
    }
    // Generic Edge detection - has fetch but no process
    if (typeof (globalThis as any).fetch !== 'undefined') {
      return RuntimeType.EDGE;
    }
  }

  // Additional Edge Runtime detection for Cloudflare Workers
  if (typeof (globalThis as any).caches !== 'undefined' && 
      typeof (globalThis as any).process === 'undefined') {
    return RuntimeType.EDGE;
  }

  return RuntimeType.UNKNOWN;
}

/**
 * Environment variable abstraction
 * Works across different runtime environments
 */
export function getEnvironmentVariable(key: string, defaultValue?: string): string | undefined {
  const runtime = detectRuntimeType();

  switch (runtime) {
    case RuntimeType.NODE:
      // Node.js environment
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
      }
      break;

    case RuntimeType.DENO:
      // Deno environment
      try {
        const denoEnv = (globalThis as any).Deno?.env;
        if (denoEnv && typeof denoEnv.get === 'function') {
          return denoEnv.get(key) || defaultValue;
        }
      } catch {
        // Deno may require permissions
      }
      break;

    case RuntimeType.BUN:
      // Bun environment
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
      }
      break;

    case RuntimeType.EDGE:
      // Edge Runtime (Vercel/Cloudflare Workers)
      // Try to access environment variables through globalThis
      if (typeof (globalThis as any)[key] !== 'undefined') {
        return String((globalThis as any)[key]);
      }
      break;

    case RuntimeType.BROWSER:
      // Browser environment - no direct env var access
      // Could potentially read from window object if exposed
      if (typeof (window as any).__ENV__ === 'object' && 
          (window as any).__ENV__[key]) {
        return (window as any).__ENV__[key];
      }
      break;
  }

  return defaultValue;
}

/**
 * Detect if running in production mode
 * Works across different environments
 */
export function isProductionEnvironment(): boolean {
  // Check various production indicators
  const nodeEnv = getEnvironmentVariable('NODE_ENV');
  if (nodeEnv === 'production') return true;
  
  const environment = getEnvironmentVariable('ENVIRONMENT');
  if (environment === 'production' || environment === 'prod') return true;
  
  const vercelEnv = getEnvironmentVariable('VERCEL_ENV');
  if (vercelEnv === 'production') return true;
  
  const cfPages = getEnvironmentVariable('CF_PAGES');
  const cfPagesBranch = getEnvironmentVariable('CF_PAGES_BRANCH');
  if (cfPages === '1' && cfPagesBranch === 'main') return true;
  
  return false;
}

/**
 * Enhanced environment detection that works across all runtimes
 */
export function detectEnvironment(): Environment {
  const runtime = detectRuntimeType();
  const isProduction = isProductionEnvironment();
  
  return {
    isBrowser: runtime === RuntimeType.BROWSER,
    isNode: runtime === RuntimeType.NODE,
    isDevelopment: !isProduction,
    isProduction,
    // Additional runtime info
    runtime
  };
}

/**
 * Performance timing abstraction
 * Works across different environments
 */
export function getHighResolutionTime(): number {
  // Try performance.now() first (available in most environments)
  if (typeof performance !== 'undefined' && 
      typeof performance.now === 'function') {
    return performance.now();
  }
  
  // Fallback to Date for environments without performance API
  return Date.now();
}

/**
 * Check if a global object exists
 * Useful for feature detection
 */
export function hasGlobal(name: string): boolean {
  try {
    return typeof (globalThis as any)[name] !== 'undefined';
  } catch {
    return false;
  }
}