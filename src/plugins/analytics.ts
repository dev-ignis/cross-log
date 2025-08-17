import { PluginContext, AnalyticsPlugin, AnalyticsPluginConfig, PluginInstance } from './types';
import { TypedPlugin } from './plugin-types';

export class AnalyticsEventPlugin implements TypedPlugin<'analytics'> {
  name: 'analytics' = 'analytics';
  version = '1.0.0';
  config: AnalyticsPluginConfig;
  methods?: AnalyticsPlugin;
  private context?: PluginContext;
  private userContext?: Record<string, any>;

  constructor(config?: AnalyticsPluginConfig) {
    this.config = {
      enabled: true,
      providers: ['google', 'facebook', 'mixpanel'],
      includeUserContext: true,
      ...config
    };
  }

  init(context: PluginContext): void {
    this.context = context;

    if (this.config.includeUserContext) {
      this.userContext = this.detectUserContext();
    }

    const methods: AnalyticsPlugin = {
      event: this.event.bind(this),
      pageView: this.pageView.bind(this),
      conversion: this.conversion.bind(this),
      identify: this.identify.bind(this)
    };

    (context as any).methods = methods;
    
    const instance = context as unknown as PluginInstance;
    instance.methods = methods as any;
  }

  private detectUserContext(): Record<string, any> {
    const context: Record<string, any> = {
      timestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      context.userAgent = window.navigator.userAgent;
      context.language = window.navigator.language;
      context.platform = window.navigator.platform;
      context.screenResolution = `${window.screen.width}x${window.screen.height}`;
      context.viewport = `${window.innerWidth}x${window.innerHeight}`;
      context.referrer = document.referrer;
      context.url = window.location.href;
    }

    if (typeof process !== 'undefined' && process.versions) {
      context.nodeVersion = process.version;
      context.platform = process.platform;
      context.arch = process.arch;
    }

    return context;
  }

  private isValidProvider(provider?: string): boolean {
    if (!provider) return true;
    return this.config.providers?.includes(provider) ?? true;
  }

  event(name: string, provider?: string, properties?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    if (provider && !this.isValidProvider(provider)) {
      this.context.logger.warn(`Analytics provider "${provider}" is not configured`, 'Analytics');
      return;
    }

    const logData: Record<string, any> = {
      type: 'analytics_event',
      eventName: name,
      timestamp: new Date().toISOString()
    };

    if (provider) {
      logData.provider = provider;
    }

    if (properties) {
      logData.properties = properties;
    }

    if (this.config.includeUserContext && this.userContext) {
      logData.userContext = this.userContext;
    }

    const message = `Analytics Event: ${name}${provider ? ` (${provider})` : ''}`;

    this.context.logger.info(message, 'Analytics', logData);
  }

  pageView(url: string, provider?: string, properties?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    if (provider && !this.isValidProvider(provider)) {
      this.context.logger.warn(`Analytics provider "${provider}" is not configured`, 'Analytics');
      return;
    }

    const logData: Record<string, any> = {
      type: 'analytics_pageview',
      url,
      timestamp: new Date().toISOString()
    };

    if (provider) {
      logData.provider = provider;
    }

    if (properties) {
      logData.properties = properties;
    }

    if (this.config.includeUserContext && this.userContext) {
      logData.userContext = this.userContext;
    }

    const message = `Analytics PageView: ${url}${provider ? ` (${provider})` : ''}`;

    this.context.logger.info(message, 'Analytics', logData);
  }

  conversion(name: string, value?: number, provider?: string, properties?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    if (provider && !this.isValidProvider(provider)) {
      this.context.logger.warn(`Analytics provider "${provider}" is not configured`, 'Analytics');
      return;
    }

    const logData: Record<string, any> = {
      type: 'analytics_conversion',
      conversionName: name,
      timestamp: new Date().toISOString()
    };

    if (value !== undefined) {
      logData.value = value;
    }

    if (provider) {
      logData.provider = provider;
    }

    if (properties) {
      logData.properties = properties;
    }

    if (this.config.includeUserContext && this.userContext) {
      logData.userContext = this.userContext;
    }

    const message = `Analytics Conversion: ${name}${value !== undefined ? ` (value: ${value})` : ''}${provider ? ` [${provider}]` : ''}`;

    this.context.logger.info(message, 'Analytics', logData);
  }

  identify(userId: string, traits?: Record<string, any>, provider?: string): void {
    if (!this.context || !this.config.enabled) return;

    if (provider && !this.isValidProvider(provider)) {
      this.context.logger.warn(`Analytics provider "${provider}" is not configured`, 'Analytics');
      return;
    }

    const logData: Record<string, any> = {
      type: 'analytics_identify',
      userId,
      timestamp: new Date().toISOString()
    };

    if (traits) {
      logData.traits = traits;
    }

    if (provider) {
      logData.provider = provider;
    }

    if (this.config.includeUserContext) {
      this.userContext = {
        ...this.userContext,
        userId,
        ...traits
      };
      logData.userContext = this.userContext;
    }

    const message = `Analytics Identify: User ${userId}${provider ? ` (${provider})` : ''}`;

    this.context.logger.info(message, 'Analytics', logData);
  }

  destroy(): void {
    this.context = undefined;
    this.userContext = undefined;
  }
}

export function createAnalyticsPlugin(config?: AnalyticsPluginConfig): AnalyticsEventPlugin {
  return new AnalyticsEventPlugin(config);
}