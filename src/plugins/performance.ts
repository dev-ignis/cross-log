import { PluginContext, PerformancePlugin, PerformancePluginConfig, WebVitalsMetrics, PluginInstance } from './types';
import { TypedPlugin } from './plugin-types';

export class PerformanceMetricsPlugin implements TypedPlugin<'performance'> {
  name: 'performance' = 'performance';
  version = '1.0.0';
  config: PerformancePluginConfig;
  methods?: PerformancePlugin;
  private context?: PluginContext;
  private marks: Map<string, number> = new Map();

  constructor(config?: PerformancePluginConfig) {
    this.config = {
      enabled: true,
      webVitals: true,
      resourceTiming: true,
      thresholds: {
        fcp: 1800,
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        ttfb: 800
      },
      ...config
    };
  }

  init(context: PluginContext): void {
    this.context = context;

    const methods: PerformancePlugin = {
      measure: this.measure.bind(this),
      mark: this.mark.bind(this),
      webVitals: this.webVitals.bind(this),
      resource: this.resource.bind(this),
      cache: this.cache.bind(this)
    };

    (context as any).methods = methods;
    
    const instance = context as unknown as PluginInstance;
    instance.methods = methods as any;

    if (this.config.webVitals && typeof window !== 'undefined') {
      this.observeWebVitals();
    }
  }

  private observeWebVitals(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              this.webVitals({ fcp: entry.startTime });
            }
          } else if (entry.entryType === 'largest-contentful-paint') {
            this.webVitals({ lcp: entry.startTime });
          } else if (entry.entryType === 'first-input') {
            const fidEntry = entry as any;
            this.webVitals({ fid: fidEntry.processingStart - fidEntry.startTime });
          } else if (entry.entryType === 'layout-shift') {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput) {
              this.webVitals({ cls: clsEntry.value });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      this.context?.logger.debug('Failed to observe Web Vitals', 'Performance', error);
    }
  }

  private formatDuration(duration: number): string {
    if (duration < 1000) return `${duration.toFixed(2)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }

  measure(name: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'performance_measure',
      name,
      duration: this.formatDuration(duration),
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    if (metadata) {
      logData.metadata = metadata;
    }

    const message = `Performance Measure: ${name} - ${this.formatDuration(duration)}`;

    this.context.logger.info(message, 'Performance', logData);
  }

  mark(name: string, metadata?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const now = performance?.now() ?? Date.now();
    const previousMark = this.marks.get(name);
    this.marks.set(name, now);

    const logData: Record<string, any> = {
      type: 'performance_mark',
      name,
      timestamp: new Date().toISOString(),
      markTime: now
    };

    if (previousMark !== undefined) {
      const duration = now - previousMark;
      logData.durationSinceLast = this.formatDuration(duration);
      logData.durationMs = duration;
    }

    if (metadata) {
      logData.metadata = metadata;
    }

    const message = `Performance Mark: ${name}${
      previousMark !== undefined ? ` (${this.formatDuration(now - previousMark)} since last)` : ''
    }`;

    this.context.logger.debug(message, 'Performance', logData);
  }

  webVitals(metrics: WebVitalsMetrics): void {
    if (!this.context || !this.config.enabled || !this.config.webVitals) return;

    const logData: Record<string, any> = {
      type: 'web_vitals',
      metrics: {},
      timestamp: new Date().toISOString()
    };

    const warnings: string[] = [];

    if (metrics.fcp !== undefined) {
      logData.metrics.fcp = metrics.fcp;
      if (this.config.thresholds?.fcp && metrics.fcp > this.config.thresholds.fcp) {
        warnings.push(`FCP ${metrics.fcp.toFixed(2)}ms exceeds threshold ${this.config.thresholds.fcp}ms`);
      }
    }

    if (metrics.lcp !== undefined) {
      logData.metrics.lcp = metrics.lcp;
      if (this.config.thresholds?.lcp && metrics.lcp > this.config.thresholds.lcp) {
        warnings.push(`LCP ${metrics.lcp.toFixed(2)}ms exceeds threshold ${this.config.thresholds.lcp}ms`);
      }
    }

    if (metrics.fid !== undefined) {
      logData.metrics.fid = metrics.fid;
      if (this.config.thresholds?.fid && metrics.fid > this.config.thresholds.fid) {
        warnings.push(`FID ${metrics.fid.toFixed(2)}ms exceeds threshold ${this.config.thresholds.fid}ms`);
      }
    }

    if (metrics.cls !== undefined) {
      logData.metrics.cls = metrics.cls;
      if (this.config.thresholds?.cls && metrics.cls > this.config.thresholds.cls) {
        warnings.push(`CLS ${metrics.cls.toFixed(3)} exceeds threshold ${this.config.thresholds.cls}`);
      }
    }

    if (metrics.ttfb !== undefined) {
      logData.metrics.ttfb = metrics.ttfb;
      if (this.config.thresholds?.ttfb && metrics.ttfb > this.config.thresholds.ttfb) {
        warnings.push(`TTFB ${metrics.ttfb.toFixed(2)}ms exceeds threshold ${this.config.thresholds.ttfb}ms`);
      }
    }

    if (metrics.inp !== undefined) {
      logData.metrics.inp = metrics.inp;
    }

    const metricNames = Object.keys(metrics).map(k => k.toUpperCase()).join(', ');
    const message = `Web Vitals: ${metricNames}`;

    if (warnings.length > 0) {
      logData.warnings = warnings;
      this.context.logger.warn(message, 'Performance', logData);
    } else {
      this.context.logger.info(message, 'Performance', logData);
    }
  }

  resource(name: string, type: string, duration: number, size?: number): void {
    if (!this.context || !this.config.enabled || !this.config.resourceTiming) return;

    const logData: Record<string, any> = {
      type: 'resource_timing',
      resourceName: name,
      resourceType: type,
      duration: this.formatDuration(duration),
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    if (size !== undefined) {
      logData.size = size;
      logData.sizeFormatted = this.formatBytes(size);
    }

    const message = `Resource Load: ${type} - ${name} (${this.formatDuration(duration)})${
      size !== undefined ? ` - ${this.formatBytes(size)}` : ''
    }`;

    if (duration > 3000) {
      this.context.logger.warn(message, 'Performance', logData);
    } else {
      this.context.logger.debug(message, 'Performance', logData);
    }
  }

  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration?: number): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'cache_operation',
      operation,
      key,
      timestamp: new Date().toISOString()
    };

    if (duration !== undefined) {
      logData.duration = this.formatDuration(duration);
      logData.durationMs = duration;
    }

    const emoji = {
      hit: '✓',
      miss: '✗',
      set: '+',
      delete: '-'
    }[operation];

    const message = `Cache ${operation.toUpperCase()} ${emoji}: ${key}${
      duration !== undefined ? ` (${this.formatDuration(duration)})` : ''
    }`;

    const level = operation === 'hit' ? 'debug' : operation === 'miss' ? 'info' : 'debug';
    
    if (level === 'info') {
      this.context.logger.info(message, 'Performance', logData);
    } else {
      this.context.logger.debug(message, 'Performance', logData);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  destroy(): void {
    this.context = undefined;
    this.marks.clear();
  }
}

export function createPerformancePlugin(config?: PerformancePluginConfig): PerformanceMetricsPlugin {
  return new PerformanceMetricsPlugin(config);
}