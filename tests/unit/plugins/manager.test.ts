import { PluginManager } from '../../../src/plugins/manager';
import { createApiPlugin } from '../../../src/plugins/api';
import { createDatabasePlugin } from '../../../src/plugins/database';
import { createLogger } from '../../../src';

describe('PluginManager', () => {
  let logger: any;
  let manager: PluginManager;

  beforeEach(() => {
    // Set up spies first
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Then create logger and manager
    logger = createLogger({ minLevel: 0 });
    manager = new PluginManager(logger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Plugin Registration', () => {
    it('should register a plugin', () => {
      const plugin = createApiPlugin();
      manager.use(plugin);
      
      expect(manager.hasPlugin('api')).toBe(true);
      expect(manager.getPlugin('api')).toBeDefined();
    });

    it('should warn when registering duplicate plugin', () => {
      const plugin = createApiPlugin();
      
      manager.use(plugin);
      
      // Get the existing warn spy that was set up in beforeEach
      const warnSpy = jest.spyOn(console, 'warn');
      
      manager.use(plugin);
      
      expect(warnSpy).toHaveBeenCalled();
      const warnCall = warnSpy.mock.calls.find(call => 
        call[0] && call[0].includes('already registered')
      );
      expect(warnCall).toBeDefined();
    });

    it('should register multiple different plugins', () => {
      const apiPlugin = createApiPlugin();
      const dbPlugin = createDatabasePlugin();
      
      manager.use(apiPlugin);
      manager.use(dbPlugin);
      
      expect(manager.hasPlugin('api')).toBe(true);
      expect(manager.hasPlugin('database')).toBe(true);
      expect(manager.getAllPlugins()).toHaveLength(2);
    });

    it('should throw error if plugin init fails', () => {
      const badPlugin = {
        name: 'bad',
        init: () => { throw new Error('Init failed'); }
      };
      
      expect(() => manager.use(badPlugin)).toThrow('Init failed');
    });
  });

  describe('Plugin Removal', () => {
    it('should remove a plugin', () => {
      const plugin = createApiPlugin();
      manager.use(plugin);
      
      expect(manager.hasPlugin('api')).toBe(true);
      
      const result = manager.remove('api');
      
      expect(result).toBe(true);
      expect(manager.hasPlugin('api')).toBe(false);
    });

    it('should return false when removing non-existent plugin', () => {
      const result = manager.remove('nonexistent');
      expect(result).toBe(false);
    });

    it('should call destroy when removing plugin', () => {
      const plugin = createApiPlugin();
      const destroySpy = jest.spyOn(plugin, 'destroy');
      
      manager.use(plugin);
      manager.remove('api');
      
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should handle destroy errors gracefully', () => {
      const plugin = {
        name: 'error-plugin',
        init: jest.fn(),
        destroy: jest.fn(() => { throw new Error('Destroy failed'); })
      };
      
      manager.use(plugin);
      const result = manager.remove('error-plugin');
      
      expect(result).toBe(false);
    });
  });

  describe('Plugin Methods Attachment', () => {
    it('should attach API plugin methods to logger', () => {
      const plugin = createApiPlugin();
      logger.use(plugin);
      
      expect(logger.api).toBeDefined();
      expect(logger.api?.request).toBeDefined();
    });

    it('should attach database plugin methods to logger', () => {
      const plugin = createDatabasePlugin();
      logger.use(plugin);
      
      expect(logger.database).toBeDefined();
      expect(logger.database?.query).toBeDefined();
    });

    it('should detach plugin methods on removal', () => {
      const plugin = createApiPlugin();
      logger.use(plugin);
      
      expect(logger.api).toBeDefined();
      
      // Use the logger's plugin manager to remove
      const pluginManager = (logger as any).pluginManager;
      pluginManager.remove('api');
      
      expect(logger.api).toBeUndefined();
    });
  });

  describe('Plugin Queries', () => {
    it('should get plugin by name', () => {
      const plugin = createApiPlugin();
      manager.use(plugin);
      
      const instance = manager.getPlugin('api');
      expect(instance).toBeDefined();
      expect(instance?.plugin.name).toBe('api');
    });

    it('should return undefined for non-existent plugin', () => {
      const instance = manager.getPlugin('nonexistent');
      expect(instance).toBeUndefined();
    });

    it('should get all plugins', () => {
      const apiPlugin = createApiPlugin();
      const dbPlugin = createDatabasePlugin();
      
      manager.use(apiPlugin);
      manager.use(dbPlugin);
      
      const plugins = manager.getAllPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.plugin.name)).toContain('api');
      expect(plugins.map(p => p.plugin.name)).toContain('database');
    });

    it('should check if plugin exists', () => {
      const plugin = createApiPlugin();
      
      expect(manager.hasPlugin('api')).toBe(false);
      
      manager.use(plugin);
      
      expect(manager.hasPlugin('api')).toBe(true);
    });
  });

  describe('Clear All Plugins', () => {
    it('should clear all plugins', () => {
      const apiPlugin = createApiPlugin();
      const dbPlugin = createDatabasePlugin();
      
      manager.use(apiPlugin);
      manager.use(dbPlugin);
      
      expect(manager.getAllPlugins()).toHaveLength(2);
      
      manager.clear();
      
      expect(manager.getAllPlugins()).toHaveLength(0);
      expect(manager.hasPlugin('api')).toBe(false);
      expect(manager.hasPlugin('database')).toBe(false);
    });

    it('should call destroy on all plugins when clearing', () => {
      const plugin1 = createApiPlugin();
      const plugin2 = createDatabasePlugin();
      
      const destroySpy1 = jest.spyOn(plugin1, 'destroy');
      const destroySpy2 = jest.spyOn(plugin2, 'destroy');
      
      manager.use(plugin1);
      manager.use(plugin2);
      
      manager.clear();
      
      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
    });
  });
});