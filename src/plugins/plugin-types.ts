/**
 * Advanced type definitions for the plugin system with full TypeScript support
 */

import { ILogger } from '../core/types';
import {
  Plugin,
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

/**
 * Plugin registry mapping plugin names to their configurations and method types
 */
export interface PluginRegistry {
  api: {
    config: ApiPluginConfig;
    methods: ApiPlugin;
  };
  database: {
    config: DatabasePluginConfig;
    methods: DatabasePlugin;
  };
  analytics: {
    config: AnalyticsPluginConfig;
    methods: AnalyticsPlugin;
  };
  performance: {
    config: PerformancePluginConfig;
    methods: PerformancePlugin;
  };
  security: {
    config: SecurityPluginConfig;
    methods: SecurityPlugin;
  };
}

/**
 * Extract plugin names from registry
 */
export type PluginName = keyof PluginRegistry;

/**
 * Extract plugin methods for a specific plugin
 */
export type PluginMethods<T extends PluginName> = PluginRegistry[T]['methods'];

/**
 * Extract plugin config for a specific plugin
 */
export type PluginConfigType<T extends PluginName> = PluginRegistry[T]['config'];

/**
 * Type-safe plugin instance with methods
 */
export interface TypedPlugin<T extends PluginName> extends Plugin<PluginConfigType<T>> {
  name: T;
  methods?: PluginMethods<T>;
}

/**
 * Logger with specific plugins loaded
 */
export type LoggerWithPlugins<P extends PluginName[] = []> = ILogger & {
  [K in P[number]]: PluginMethods<K>;
} & {
  use<T extends PluginName>(plugin: TypedPlugin<T>): LoggerWithPlugins<[...P, T]>;
  getPlugin<T extends PluginName>(name: T): TypedPlugin<T> | undefined;
  hasPlugin(name: PluginName): boolean;
  removePlugin(name: PluginName): void;
};

/**
 * Builder pattern for creating loggers with plugins
 */
export interface LoggerBuilder<P extends PluginName[] = []> {
  withPlugin<T extends PluginName>(
    plugin: TypedPlugin<T>
  ): LoggerBuilder<[...P, T]>;
  
  build(): LoggerWithPlugins<P>;
}

/**
 * Plugin factory function type
 */
export type PluginFactory<T extends PluginName> = (
  config?: Partial<PluginConfigType<T>>
) => TypedPlugin<T>;

/**
 * Registry of plugin factories
 */
export interface PluginFactories {
  api: PluginFactory<'api'>;
  database: PluginFactory<'database'>;
  analytics: PluginFactory<'analytics'>;
  performance: PluginFactory<'performance'>;
  security: PluginFactory<'security'>;
}

/**
 * Configuration for creating a logger with plugins
 */
export interface LoggerWithPluginsConfig {
  api?: Partial<ApiPluginConfig>;
  database?: Partial<DatabasePluginConfig>;
  analytics?: Partial<AnalyticsPluginConfig>;
  performance?: Partial<PerformancePluginConfig>;
  security?: Partial<SecurityPluginConfig>;
}

/**
 * Type helper to extract enabled plugins from config
 */
export type EnabledPlugins<T extends LoggerWithPluginsConfig> = {
  [K in keyof T & PluginName]: T[K] extends object ? K : never;
}[keyof T & PluginName];

/**
 * Logger with plugins based on configuration
 */
export type ConfiguredLogger<T extends LoggerWithPluginsConfig> = LoggerWithPlugins<
  Array<EnabledPlugins<T>>
>;

/**
 * Module augmentation support for custom plugins
 */
export interface CustomPluginRegistry {}

/**
 * Combined plugin registry including custom plugins
 */
export type FullPluginRegistry = PluginRegistry & CustomPluginRegistry;

/**
 * Full plugin name including custom plugins
 */
export type FullPluginName = keyof FullPluginRegistry;

/**
 * Conditional types for dynamic plugin loading
 */

/**
 * Extract plugin names from a union of plugin configurations
 */
export type ExtractPluginNames<T> = T extends { [K in PluginName]?: any }
  ? Extract<keyof T, PluginName>
  : never;

/**
 * Conditional logger type based on loaded plugins
 */
export type ConditionalLogger<T extends PluginName | never = never> = ILogger & 
  (T extends never 
    ? {} 
    : T extends PluginName 
      ? Record<T, PluginMethods<T>>
      : {});

/**
 * Dynamic plugin loader return type
 */
export type DynamicPluginLoader<T extends PluginName[]> = ILogger & {
  [K in T[number]]: PluginMethods<K>;
} & {
  loadPlugin<P extends PluginName>(
    name: P, 
    config?: PluginConfigType<P>
  ): DynamicPluginLoader<[...T, P]>;
  unloadPlugin<P extends T[number]>(
    name: P
  ): DynamicPluginLoader<Exclude<T[number], P>[]>;
};

/**
 * Plugin-aware logger with runtime type checking
 */
export interface PluginAwareLogger<T extends PluginName[] = []> extends ILogger {
  /**
   * Load a new plugin dynamically
   */
  withPlugin<P extends PluginName>(
    plugin: TypedPlugin<P>
  ): PluginAwareLogger<[...T, P]>;
  
  /**
   * Check if specific plugins are loaded (type guard)
   */
  hasPlugins<P extends PluginName[]>(
    plugins: P
  ): this is PluginAwareLogger<[...T, ...P]>;
  
  /**
   * Get all loaded plugin names
   */
  getLoadedPlugins(): T;
}

/**
 * Utility type to check if a plugin is in a list
 */
export type HasPlugin<T extends PluginName[], P extends PluginName> = 
  P extends T[number] ? true : false;

/**
 * Utility type to require specific plugins
 */
export type RequirePlugins<T extends PluginName[]> = ILogger & {
  [K in T[number]]: PluginMethods<K>;
};

/**
 * Utility type for optional plugins
 */
export type OptionalPlugins<T extends PluginName[]> = ILogger & {
  [K in T[number]]?: PluginMethods<K>;
};

/**
 * Mixed plugin requirements (some required, some optional)
 */
export type MixedPlugins<
  R extends PluginName[], 
  O extends PluginName[]
> = ILogger & {
  [K in R[number]]: PluginMethods<K>;
} & {
  [K in O[number]]?: PluginMethods<K>;
};

/**
 * Plugin combination validator
 */
export type ValidPluginCombination<T extends PluginName[]> = 
  T extends readonly PluginName[] ? T : never;

/**
 * Type-safe plugin configuration builder
 */
export type PluginConfigBuilder<T extends PluginName[]> = {
  [K in T[number]]?: PluginConfigType<K>;
};

/**
 * Infer plugin names from a logger instance
 */
export type InferPlugins<T> = T extends LoggerWithPlugins<infer P> ? P : never;

/**
 * Check if a type is a valid plugin-enabled logger
 */
export type IsPluginLogger<T> = T extends LoggerWithPlugins<any> ? true : false;