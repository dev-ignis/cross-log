// Export from types first, but exclude LoggerWithPlugins
export {
  Plugin,
  PluginConfig,
  PluginContext,
  PluginInstance,
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
  WebVitalsMetrics,
  SecuritySeverity
} from './types';

// Export from plugin-types, including LoggerWithPlugins
export * from './plugin-types';
export * from './builder';
export * from './manager';
export * from './api';
export * from './database';
export * from './analytics';
export * from './performance';
export * from './security';

// Import augmentation to ensure types are available
import './augmentation';

import { createApiPlugin } from './api';
import { createDatabasePlugin } from './database';
import { createAnalyticsPlugin } from './analytics';
import { createPerformancePlugin } from './performance';
import { createSecurityPlugin } from './security';
import { PluginFactories } from './plugin-types';

export const plugins: PluginFactories = {
  api: createApiPlugin,
  database: createDatabasePlugin,
  analytics: createAnalyticsPlugin,
  performance: createPerformancePlugin,
  security: createSecurityPlugin
};

export default plugins;