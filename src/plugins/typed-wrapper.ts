/**
 * Type-safe wrapper for creating fully typed loggers without casting
 * This provides the best TypeScript experience with zero type casting required
 */

import { ILogger, PartialLoggerConfig } from '../core/types';
import { createLogger } from '../index';
import { 
  ApiPlugin,
  DatabasePlugin,
  AnalyticsPlugin,
  PerformancePlugin,
  SecurityPlugin,
  ApiPluginConfig,
  DatabasePluginConfig,
  AnalyticsPluginConfig,
  PerformancePluginConfig,
  SecurityPluginConfig
} from './types';
import { plugins } from './index';

/**
 * Fully typed logger interface with all possible plugin methods
 * No casting required when using this interface
 */
export interface TypedLogger extends ILogger {
  api: ApiPlugin;
  database: DatabasePlugin;
  analytics: AnalyticsPlugin;
  performance: PerformancePlugin;
  security: SecurityPlugin;
  
  /**
   * Enhanced use method with proper return type
   */
  use(plugin: any): ILogger;
  
  /**
   * Type-safe plugin getter
   */
  getPlugin(name: string): any;
}

/**
 * Partial typed logger where plugins are optional
 */
export interface PartialTypedLogger extends ILogger {
  api?: ApiPlugin;
  database?: DatabasePlugin;
  analytics?: AnalyticsPlugin;
  performance?: PerformancePlugin;
  security?: SecurityPlugin;
}

/**
 * Plugin method mapping for type safety
 */
interface PluginMethodMap {
  api: ApiPlugin;
  database: DatabasePlugin;
  analytics: AnalyticsPlugin;
  performance: PerformancePlugin;
  security: SecurityPlugin;
}

/**
 * Configuration for creating a typed logger with specific plugins
 */
export interface TypedLoggerConfig {
  logger?: PartialLoggerConfig;
  plugins?: {
    api?: Partial<ApiPluginConfig> | boolean;
    database?: Partial<DatabasePluginConfig> | boolean;
    analytics?: Partial<AnalyticsPluginConfig> | boolean;
    performance?: Partial<PerformancePluginConfig> | boolean;
    security?: Partial<SecurityPluginConfig> | boolean;
  };
}

/**
 * Create a fully typed logger with all plugins loaded
 * No type casting required - everything is properly typed
 */
export function createTypedLogger(config?: TypedLoggerConfig): TypedLogger {
  const logger = createLogger(config?.logger) as any;
  
  // Add all plugins with default configs
  logger.use(plugins.api(typeof config?.plugins?.api === 'object' ? config.plugins.api : {}));
  logger.use(plugins.database(typeof config?.plugins?.database === 'object' ? config.plugins.database : {}));
  logger.use(plugins.analytics(typeof config?.plugins?.analytics === 'object' ? config.plugins.analytics : {}));
  logger.use(plugins.performance(typeof config?.plugins?.performance === 'object' ? config.plugins.performance : {}));
  logger.use(plugins.security(typeof config?.plugins?.security === 'object' ? config.plugins.security : {}));
  
  return logger as TypedLogger;
}

/**
 * Create a partial typed logger with only specified plugins
 * Provides type safety while allowing optional plugins
 */
export function createPartialTypedLogger(
  config?: TypedLoggerConfig
): PartialTypedLogger {
  const logger = createLogger(config?.logger) as any;
  
  if (config?.plugins) {
    // Only add requested plugins
    if (config.plugins.api !== false) {
      logger.use(plugins.api(
        typeof config.plugins.api === 'object' ? config.plugins.api : {}
      ));
    }
    if (config.plugins.database !== false) {
      logger.use(plugins.database(
        typeof config.plugins.database === 'object' ? config.plugins.database : {}
      ));
    }
    if (config.plugins.analytics !== false) {
      logger.use(plugins.analytics(
        typeof config.plugins.analytics === 'object' ? config.plugins.analytics : {}
      ));
    }
    if (config.plugins.performance !== false) {
      logger.use(plugins.performance(
        typeof config.plugins.performance === 'object' ? config.plugins.performance : {}
      ));
    }
    if (config.plugins.security !== false) {
      logger.use(plugins.security(
        typeof config.plugins.security === 'object' ? config.plugins.security : {}
      ));
    }
  }
  
  return logger as PartialTypedLogger;
}

/**
 * Type predicate to check if a plugin is available
 */
export function isPluginAvailable<K extends keyof PluginMethodMap>(
  logger: PartialTypedLogger,
  plugin: K
): logger is PartialTypedLogger & Record<K, PluginMethodMap[K]> {
  return plugin in logger && logger[plugin] !== undefined;
}

/**
 * Factory function with conditional types for specific plugin combinations
 */
export function createLoggerWithSelectedPlugins<
  T extends Partial<Record<keyof PluginMethodMap, any>>
>(
  loggerConfig?: PartialLoggerConfig,
  pluginSelection?: T
): ILogger & {
  [K in keyof T]: K extends keyof PluginMethodMap ? PluginMethodMap[K] : never;
} {
  const logger = createLogger(loggerConfig) as any;
  
  if (pluginSelection) {
    // Type-safe plugin loading
    if ('api' in pluginSelection) {
      logger.use(plugins.api(pluginSelection.api || {}));
    }
    if ('database' in pluginSelection) {
      logger.use(plugins.database(pluginSelection.database || {}));
    }
    if ('analytics' in pluginSelection) {
      logger.use(plugins.analytics(pluginSelection.analytics || {}));
    }
    if ('performance' in pluginSelection) {
      logger.use(plugins.performance(pluginSelection.performance || {}));
    }
    if ('security' in pluginSelection) {
      logger.use(plugins.security(pluginSelection.security || {}));
    }
  }
  
  return logger;
}

/**
 * Async factory for lazy-loading plugins
 */
export async function createAsyncTypedLogger(
  config?: TypedLoggerConfig,
  lazyPlugins?: Array<keyof PluginMethodMap>
): Promise<PartialTypedLogger> {
  const logger = createLogger(config?.logger) as any;
  
  // Load plugins asynchronously
  const loadPromises: Promise<void>[] = [];
  
  if (!lazyPlugins || lazyPlugins.includes('api')) {
    loadPromises.push(
      Promise.resolve().then(() => {
        logger.use(plugins.api(
          typeof config?.plugins?.api === 'object' ? config.plugins.api : {}
        ));
      })
    );
  }
  
  if (!lazyPlugins || lazyPlugins.includes('database')) {
    loadPromises.push(
      Promise.resolve().then(() => {
        logger.use(plugins.database(
          typeof config?.plugins?.database === 'object' ? config.plugins.database : {}
        ));
      })
    );
  }
  
  if (!lazyPlugins || lazyPlugins.includes('analytics')) {
    loadPromises.push(
      Promise.resolve().then(() => {
        logger.use(plugins.analytics(
          typeof config?.plugins?.analytics === 'object' ? config.plugins.analytics : {}
        ));
      })
    );
  }
  
  if (!lazyPlugins || lazyPlugins.includes('performance')) {
    loadPromises.push(
      Promise.resolve().then(() => {
        logger.use(plugins.performance(
          typeof config?.plugins?.performance === 'object' ? config.plugins.performance : {}
        ));
      })
    );
  }
  
  if (!lazyPlugins || lazyPlugins.includes('security')) {
    loadPromises.push(
      Promise.resolve().then(() => {
        logger.use(plugins.security(
          typeof config?.plugins?.security === 'object' ? config.plugins.security : {}
        ));
      })
    );
  }
  
  await Promise.all(loadPromises);
  
  return logger as PartialTypedLogger;
}