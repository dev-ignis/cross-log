import { ILogger } from '../core/types';

export interface PluginContext {
  logger: ILogger;
  config: PluginConfig;
}

export interface PluginConfig {
  enabled?: boolean;
  [key: string]: any;
}

export interface Plugin<T extends PluginConfig = PluginConfig> {
  name: string;
  version?: string;
  init(context: PluginContext): void;
  destroy?(): void;
  config?: T;
}

export interface PluginInstance {
  plugin: Plugin;
  context: PluginContext;
  methods?: Record<string, Function> | ApiPlugin | DatabasePlugin | AnalyticsPlugin | PerformancePlugin | SecurityPlugin;
}

export interface LoggerWithPlugins extends ILogger {
  use(plugin: Plugin): ILogger;
  getPlugin(name: string): Plugin | undefined;
  hasPlugin(name: string): boolean;
  removePlugin(name: string): void;
  api?: ApiPlugin;
  database?: DatabasePlugin;
  analytics?: AnalyticsPlugin;
  performance?: PerformancePlugin;
  security?: SecurityPlugin;
}

export interface ApiPluginConfig extends PluginConfig {
  includeSessionId?: boolean;
  includeHeaders?: boolean;
  truncateUrl?: number;
}

export interface ApiPlugin {
  request(method: string, url: string, duration?: number, status?: number, data?: any): void;
  response(url: string, status: number, duration?: number, data?: any): void;
  error(method: string, url: string, error: Error | string, status?: number): void;
}

export interface DatabasePluginConfig extends PluginConfig {
  truncateQueries?: number;
  includeParams?: boolean;
  slowQueryThreshold?: number;
}

export interface DatabasePlugin {
  query(sql: string, duration?: number, rowCount?: number, params?: any[]): void;
  error(sql: string, error: Error | string, params?: any[]): void;
  transaction(id: string, action: 'begin' | 'commit' | 'rollback', duration?: number): void;
  slowQuery(sql: string, duration: number, params?: any[]): void;
}

export interface AnalyticsPluginConfig extends PluginConfig {
  providers?: string[];
  includeUserContext?: boolean;
}

export interface AnalyticsPlugin {
  event(name: string, provider?: string, properties?: Record<string, any>): void;
  pageView(url: string, provider?: string, properties?: Record<string, any>): void;
  conversion(name: string, value?: number, provider?: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>, provider?: string): void;
}

export interface PerformancePluginConfig extends PluginConfig {
  webVitals?: boolean;
  resourceTiming?: boolean;
  thresholds?: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  };
}

export interface WebVitalsMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  inp?: number; // Interaction to Next Paint
}

export interface PerformancePlugin {
  measure(name: string, duration: number, metadata?: Record<string, any>): void;
  mark(name: string, metadata?: Record<string, any>): void;
  webVitals(metrics: WebVitalsMetrics): void;
  resource(name: string, type: string, duration: number, size?: number): void;
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void;
}

export interface SecurityPluginConfig extends PluginConfig {
  severity?: boolean;
  includeIpAddress?: boolean;
  includeUserAgent?: boolean;
}

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityPlugin {
  event(type: string, severity?: SecuritySeverity, details?: Record<string, any>): void;
  authFailure(reason: string, userId?: string, details?: Record<string, any>): void;
  authSuccess(userId: string, method?: string, details?: Record<string, any>): void;
  accessDenied(resource: string, userId?: string, reason?: string): void;
  suspiciousActivity(type: string, details?: Record<string, any>): void;
  vulnerability(type: string, severity: SecuritySeverity, details?: Record<string, any>): void;
}