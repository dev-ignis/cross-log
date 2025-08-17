/**
 * Module augmentation for cross-log plugin system
 * This file provides comprehensive TypeScript module augmentation to add plugin methods to the ILogger interface
 */

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
  SecurityPluginConfig,
  Plugin
} from './types';

/**
 * Augment the core ILogger interface to include plugin methods
 */
declare module '../core/types' {
  /**
   * Enhanced ILogger interface with full plugin support and type safety
   */
  interface ILogger {
    /**
     * API logging methods - available when api plugin is loaded
     */
    api?: ApiPlugin;
    
    /**
     * Database logging methods - available when database plugin is loaded
     */
    database?: DatabasePlugin;
    
    /**
     * Analytics logging methods - available when analytics plugin is loaded
     */
    analytics?: AnalyticsPlugin;
    
    /**
     * Performance logging methods - available when performance plugin is loaded
     */
    performance?: PerformancePlugin;
    
    /**
     * Security logging methods - available when security plugin is loaded
     */
    security?: SecurityPlugin;
    
    /**
     * Type-safe plugin management with proper return types
     */
    use(plugin: Plugin): ILogger;
    
    /**
     * Get a specific plugin by name
     */
    getPlugin(name: string): Plugin | undefined;
    
    /**
     * Check if a plugin is loaded
     */
    hasPlugin(name: string): boolean;
    
    /**
     * Remove a plugin
     */
    removePlugin(name: string): void;
    
    /**
     * Access to all loaded plugins
     */
    plugins?: Record<string, Plugin>;
  }
}


/**
 * Global module augmentation for cross-log package
 */
declare module '../index' {
  /**
   * Re-export the enhanced ILogger interface with all plugin methods
   */
  export interface ILogger {
    // Plugin methods (available when plugins are loaded)
    api?: ApiPlugin;
    database?: DatabasePlugin;
    analytics?: AnalyticsPlugin;
    performance?: PerformancePlugin;
    security?: SecurityPlugin;
    
    // Enhanced plugin management with type safety
    use(plugin: Plugin): ILogger;
    getPlugin(name: string): Plugin | undefined;
    hasPlugin(name: string): boolean;
    removePlugin(name: string): void;
    plugins?: Record<string, Plugin>;
  }
  
  /**
   * Export plugin method interfaces for direct use
   */
  export interface ApiPluginMethods extends ApiPlugin {}
  export interface DatabasePluginMethods extends DatabasePlugin {}
  export interface AnalyticsPluginMethods extends AnalyticsPlugin {}
  export interface PerformancePluginMethods extends PerformancePlugin {}
  export interface SecurityPluginMethods extends SecurityPlugin {}
  
  /**
   * Export plugin configuration interfaces
   */
  export interface ApiPluginConfiguration extends ApiPluginConfig {}
  export interface DatabasePluginConfiguration extends DatabasePluginConfig {}
  export interface AnalyticsPluginConfiguration extends AnalyticsPluginConfig {}
  export interface PerformancePluginConfiguration extends PerformancePluginConfig {}
  export interface SecurityPluginConfiguration extends SecurityPluginConfig {}
  
  /**
   * Plugin registry for type-safe plugin access
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
   * Interface for extending the plugin registry with custom plugins
   * Users can augment this interface to add their own plugin types
   * 
   * @example
   * declare module 'cross-log' {
   *   interface CustomPluginRegistry {
   *     myPlugin: {
   *       config: MyPluginConfig;
   *       methods: MyPluginMethods;
   *     };
   *   }
   * }
   */
  export interface CustomPluginRegistry {}
  
  
}

/**
 * Export type aliases for easier access
 */
export type ApiPluginMethods = ApiPlugin;
export type DatabasePluginMethods = DatabasePlugin;
export type AnalyticsPluginMethods = AnalyticsPlugin;
export type PerformancePluginMethods = PerformancePlugin;
export type SecurityPluginMethods = SecurityPlugin;

export type ApiPluginConfiguration = ApiPluginConfig;
export type DatabasePluginConfiguration = DatabasePluginConfig;
export type AnalyticsPluginConfiguration = AnalyticsPluginConfig;
export type PerformancePluginConfiguration = PerformancePluginConfig;
export type SecurityPluginConfiguration = SecurityPluginConfig;


/**
 * Export empty object to make this a module
 */
export {};