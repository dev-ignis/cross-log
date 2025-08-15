export * from './types';
export * from './manager';
export * from './api';
export * from './database';
export * from './analytics';
export * from './performance';
export * from './security';

import { createApiPlugin } from './api';
import { createDatabasePlugin } from './database';
import { createAnalyticsPlugin } from './analytics';
import { createPerformancePlugin } from './performance';
import { createSecurityPlugin } from './security';

export const plugins = {
  api: createApiPlugin,
  database: createDatabasePlugin,
  analytics: createAnalyticsPlugin,
  performance: createPerformancePlugin,
  security: createSecurityPlugin
};

export default plugins;