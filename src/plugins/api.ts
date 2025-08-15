import { Plugin, PluginContext, ApiPlugin, ApiPluginConfig, PluginInstance } from './types';

export class ApiRequestPlugin implements Plugin<ApiPluginConfig> {
  name = 'api';
  version = '1.0.0';
  config: ApiPluginConfig;
  private context?: PluginContext;
  private sessionId?: string;

  constructor(config?: ApiPluginConfig) {
    this.config = {
      enabled: true,
      includeSessionId: true,
      includeHeaders: false,
      truncateUrl: 100,
      ...config
    };
  }

  init(context: PluginContext): void {
    this.context = context;
    
    if (this.config.includeSessionId) {
      this.sessionId = this.generateSessionId();
    }

    const methods: ApiPlugin = {
      request: this.request.bind(this),
      response: this.response.bind(this),
      error: this.error.bind(this)
    };

    (context as any).methods = methods;
    
    const instance = context as unknown as PluginInstance;
    instance.methods = methods as any;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private truncateUrl(url: string): string {
    if (!this.config.truncateUrl || url.length <= this.config.truncateUrl) {
      return url;
    }
    return url.substring(0, this.config.truncateUrl) + '...';
  }

  private formatDuration(duration?: number): string {
    if (duration === undefined) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }

  request(method: string, url: string, duration?: number, status?: number, data?: any): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'api_request',
      method: method.toUpperCase(),
      url: this.truncateUrl(url),
      timestamp: new Date().toISOString()
    };

    if (this.config.includeSessionId && this.sessionId) {
      logData.sessionId = this.sessionId;
    }

    if (duration !== undefined) {
      logData.duration = this.formatDuration(duration);
      logData.durationMs = duration;
    }

    if (status !== undefined) {
      logData.status = status;
    }

    if (data !== undefined) {
      logData.data = data;
    }

    const message = `API Request: ${method.toUpperCase()} ${this.truncateUrl(url)}${
      status ? ` - ${status}` : ''
    }${duration !== undefined ? ` (${this.formatDuration(duration)})` : ''}`;

    if (status && status >= 400) {
      this.context.logger.error(message, 'API', logData);
    } else if (status && status >= 300) {
      this.context.logger.warn(message, 'API', logData);
    } else {
      this.context.logger.info(message, 'API', logData);
    }
  }

  response(url: string, status: number, duration?: number, data?: any): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'api_response',
      url: this.truncateUrl(url),
      status,
      timestamp: new Date().toISOString()
    };

    if (this.config.includeSessionId && this.sessionId) {
      logData.sessionId = this.sessionId;
    }

    if (duration !== undefined) {
      logData.duration = this.formatDuration(duration);
      logData.durationMs = duration;
    }

    if (data !== undefined) {
      logData.data = data;
    }

    const message = `API Response: ${this.truncateUrl(url)} - ${status}${
      duration !== undefined ? ` (${this.formatDuration(duration)})` : ''
    }`;

    if (status >= 500) {
      this.context.logger.error(message, 'API', logData);
    } else if (status >= 400) {
      this.context.logger.warn(message, 'API', logData);
    } else {
      this.context.logger.info(message, 'API', logData);
    }
  }

  error(method: string, url: string, error: Error | string, status?: number): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'api_error',
      method: method.toUpperCase(),
      url: this.truncateUrl(url),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      timestamp: new Date().toISOString()
    };

    if (this.config.includeSessionId && this.sessionId) {
      logData.sessionId = this.sessionId;
    }

    if (status !== undefined) {
      logData.status = status;
    }

    const message = `API Error: ${method.toUpperCase()} ${this.truncateUrl(url)}${
      status ? ` - ${status}` : ''
    } - ${error instanceof Error ? error.message : error}`;

    this.context.logger.error(message, 'API', logData);
  }

  destroy(): void {
    this.context = undefined;
    this.sessionId = undefined;
  }
}

export function createApiPlugin(config?: ApiPluginConfig): ApiRequestPlugin {
  return new ApiRequestPlugin(config);
}