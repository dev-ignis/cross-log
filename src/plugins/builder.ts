/**
 * Builder pattern implementation for creating loggers with type-safe plugin support
 */

import { ILogger, PartialLoggerConfig } from '../core/types';
import { createLogger } from '../index';
import {
  PluginName,
  LoggerWithPlugins,
  LoggerBuilder,
  TypedPlugin,
  PluginMethods,
  LoggerWithPluginsConfig,
  ConfiguredLogger
} from './plugin-types';
import { PluginManager } from './manager';

/**
 * Implementation of the LoggerBuilder with type-safe plugin chaining
 */
class LoggerBuilderImpl<P extends PluginName[] = []> implements LoggerBuilder<P> {
  private logger: ILogger;
  private pluginManager: PluginManager;
  private loadedPlugins: PluginName[] = [];

  constructor(config?: PartialLoggerConfig) {
    this.logger = createLogger(config);
    this.pluginManager = new PluginManager(this.logger);
  }

  withPlugin<T extends PluginName>(
    plugin: TypedPlugin<T>
  ): LoggerBuilder<[...P, T]> {
    this.pluginManager.use(plugin);
    this.loadedPlugins.push(plugin.name);
    
    // Attach methods to logger
    const loggerWithPlugins = this.logger as any;
    const instance = this.pluginManager.getPlugin(plugin.name);
    if (instance?.methods) {
      loggerWithPlugins[plugin.name] = instance.methods;
    }
    
    return this as any;
  }

  build(): LoggerWithPlugins<P> {
    const loggerWithPlugins = this.logger as LoggerWithPlugins<P>;
    
    // Add plugin management methods
    loggerWithPlugins.use = <T extends PluginName>(plugin: TypedPlugin<T>) => {
      this.pluginManager.use(plugin);
      const instance = this.pluginManager.getPlugin(plugin.name);
      if (instance?.methods) {
        (loggerWithPlugins as any)[plugin.name] = instance.methods;
      }
      return loggerWithPlugins as any;
    };
    
    loggerWithPlugins.getPlugin = <T extends PluginName>(name: T) => {
      const instance = this.pluginManager.getPlugin(name);
      return instance ? (instance.plugin as TypedPlugin<T>) : undefined;
    };
    
    loggerWithPlugins.hasPlugin = (name: PluginName) => {
      return this.pluginManager.hasPlugin(name);
    };
    
    loggerWithPlugins.removePlugin = (name: PluginName) => {
      this.pluginManager.remove(name);
      delete (loggerWithPlugins as any)[name];
    };
    
    return loggerWithPlugins;
  }
}

/**
 * Create a new logger builder with optional configuration
 */
export function createLoggerBuilder(
  config?: PartialLoggerConfig
): LoggerBuilder {
  return new LoggerBuilderImpl(config);
}

/**
 * Create a logger with plugins using a configuration object
 * Provides full type safety for all configured plugins
 */
export function createLoggerWithPlugins<T extends LoggerWithPluginsConfig>(
  loggerConfig?: PartialLoggerConfig,
  pluginConfigs?: T
): ConfiguredLogger<T> {
  const builder = createLoggerBuilder(loggerConfig);
  let currentBuilder: any = builder;
  
  if (pluginConfigs) {
    // Import plugins dynamically to avoid circular dependencies
    const { plugins } = require('./index');
    
    // Add each configured plugin
    for (const [pluginName, config] of Object.entries(pluginConfigs)) {
      if (config && pluginName in plugins) {
        const pluginFactory = plugins[pluginName as PluginName];
        if (pluginFactory) {
          currentBuilder = currentBuilder.withPlugin(pluginFactory(config));
        }
      }
    }
  }
  
  return currentBuilder.build() as ConfiguredLogger<T>;
}

/**
 * Type-safe wrapper for existing logger instance
 * Adds type information for already loaded plugins
 */
export function wrapLogger<P extends PluginName[]>(
  logger: ILogger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pluginNames: P
): LoggerWithPlugins<P> {
  return logger as LoggerWithPlugins<P>;
}

/**
 * Type guard to check if logger has a specific plugin
 */
export function hasPlugin<T extends PluginName>(
  logger: ILogger,
  pluginName: T
): logger is ILogger & Record<T, PluginMethods<T>> {
  return pluginName in logger && typeof (logger as any)[pluginName] === 'object';
}

/**
 * Type guard to check if logger has multiple plugins
 */
export function hasPlugins<P extends PluginName[]>(
  logger: ILogger,
  pluginNames: P
): logger is LoggerWithPlugins<P> {
  return pluginNames.every(name => hasPlugin(logger, name));
}