import { ILogger } from '../core/types';
import { 
  Plugin, 
  PluginInstance, 
  PluginContext,
  LoggerWithPlugins,
  ApiPlugin,
  DatabasePlugin,
  AnalyticsPlugin,
  PerformancePlugin,
  SecurityPlugin
} from './types';

export class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  use(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin "${plugin.name}" is already registered`, 'PluginManager');
      return;
    }

    const context: PluginContext = {
      logger: this.logger,
      config: plugin.config || { enabled: true }
    };

    const instance: PluginInstance = {
      plugin,
      context
    };

    try {
      plugin.init(context);
      
      // Get methods from context after init
      if ((context as any).methods) {
        instance.methods = (context as any).methods;
      }
      
      this.plugins.set(plugin.name, instance);
      
      this.attachPluginMethods(plugin.name, instance);
      
      this.logger.debug(`Plugin "${plugin.name}" initialized successfully`, 'PluginManager');
    } catch (error) {
      this.logger.error(`Failed to initialize plugin "${plugin.name}"`, 'PluginManager', error);
      throw error;
    }
  }

  private attachPluginMethods(name: string, instance: PluginInstance): void {
    const loggerWithPlugins = this.logger as LoggerWithPlugins;
    
    switch (name) {
      case 'api':
        loggerWithPlugins.api = instance.methods as unknown as ApiPlugin;
        break;
      case 'database':
        loggerWithPlugins.database = instance.methods as unknown as DatabasePlugin;
        break;
      case 'analytics':
        loggerWithPlugins.analytics = instance.methods as unknown as AnalyticsPlugin;
        break;
      case 'performance':
        loggerWithPlugins.performance = instance.methods as unknown as PerformancePlugin;
        break;
      case 'security':
        loggerWithPlugins.security = instance.methods as unknown as SecurityPlugin;
        break;
    }
  }

  remove(name: string): boolean {
    const instance = this.plugins.get(name);
    if (!instance) {
      return false;
    }

    try {
      if (instance.plugin.destroy) {
        instance.plugin.destroy();
      }
      
      this.detachPluginMethods(name);
      this.plugins.delete(name);
      
      this.logger.debug(`Plugin "${name}" removed successfully`, 'PluginManager');
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove plugin "${name}"`, 'PluginManager', error);
      return false;
    }
  }

  private detachPluginMethods(name: string): void {
    const loggerWithPlugins = this.logger as LoggerWithPlugins;
    
    switch (name) {
      case 'api':
        delete loggerWithPlugins.api;
        break;
      case 'database':
        delete loggerWithPlugins.database;
        break;
      case 'analytics':
        delete loggerWithPlugins.analytics;
        break;
      case 'performance':
        delete loggerWithPlugins.performance;
        break;
      case 'security':
        delete loggerWithPlugins.security;
        break;
    }
  }

  getPlugin(name: string): PluginInstance | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  clear(): void {
    for (const [name] of this.plugins) {
      this.remove(name);
    }
  }
}