import { Plugin, PluginContext, DatabasePlugin, DatabasePluginConfig, PluginInstance } from './types';

export class DatabaseQueryPlugin implements Plugin<DatabasePluginConfig> {
  name = 'database';
  version = '1.0.0';
  config: DatabasePluginConfig;
  private context?: PluginContext;

  constructor(config?: DatabasePluginConfig) {
    this.config = {
      enabled: true,
      truncateQueries: 200,
      includeParams: false,
      slowQueryThreshold: 1000,
      ...config
    };
  }

  init(context: PluginContext): void {
    this.context = context;

    const methods: DatabasePlugin = {
      query: this.query.bind(this),
      error: this.error.bind(this),
      transaction: this.transaction.bind(this),
      slowQuery: this.slowQuery.bind(this)
    };

    (context as any).methods = methods;
    
    const instance = context as unknown as PluginInstance;
    instance.methods = methods as any;
  }

  private truncateQuery(sql: string): string {
    if (!this.config.truncateQueries || sql.length <= this.config.truncateQueries) {
      return sql;
    }
    return sql.substring(0, this.config.truncateQueries) + '...';
  }

  private formatDuration(duration?: number): string {
    if (duration === undefined) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }

  private sanitizeQuery(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  query(sql: string, duration?: number, rowCount?: number, params?: any[]): void {
    if (!this.context || !this.config.enabled) return;

    const sanitizedSql = this.sanitizeQuery(sql);
    const logData: Record<string, any> = {
      type: 'database_query',
      query: this.truncateQuery(sanitizedSql),
      timestamp: new Date().toISOString()
    };

    if (duration !== undefined) {
      logData.duration = this.formatDuration(duration);
      logData.durationMs = duration;

      if (this.config.slowQueryThreshold && duration >= this.config.slowQueryThreshold) {
        this.slowQuery(sql, duration, params);
        return;
      }
    }

    if (rowCount !== undefined) {
      logData.rowCount = rowCount;
    }

    if (this.config.includeParams && params) {
      logData.params = params;
    }

    const message = `Database Query: ${this.truncateQuery(sanitizedSql)}${
      duration !== undefined ? ` (${this.formatDuration(duration)})` : ''
    }${rowCount !== undefined ? ` - ${rowCount} rows` : ''}`;

    this.context.logger.debug(message, 'Database', logData);
  }

  error(sql: string, error: Error | string, params?: any[]): void {
    if (!this.context || !this.config.enabled) return;

    const sanitizedSql = this.sanitizeQuery(sql);
    const logData: Record<string, any> = {
      type: 'database_error',
      query: this.truncateQuery(sanitizedSql),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code
      } : error,
      timestamp: new Date().toISOString()
    };

    if (this.config.includeParams && params) {
      logData.params = params;
    }

    const message = `Database Error: ${this.truncateQuery(sanitizedSql)} - ${
      error instanceof Error ? error.message : error
    }`;

    this.context.logger.error(message, 'Database', logData);
  }

  transaction(id: string, action: 'begin' | 'commit' | 'rollback', duration?: number): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'database_transaction',
      transactionId: id,
      action,
      timestamp: new Date().toISOString()
    };

    if (duration !== undefined) {
      logData.duration = this.formatDuration(duration);
      logData.durationMs = duration;
    }

    const message = `Database Transaction: ${action.toUpperCase()} ${id}${
      duration !== undefined ? ` (${this.formatDuration(duration)})` : ''
    }`;

    const level = action === 'rollback' ? 'warn' : 'info';
    
    if (level === 'warn') {
      this.context.logger.warn(message, 'Database', logData);
    } else {
      this.context.logger.info(message, 'Database', logData);
    }
  }

  slowQuery(sql: string, duration: number, params?: any[]): void {
    if (!this.context || !this.config.enabled) return;

    const sanitizedSql = this.sanitizeQuery(sql);
    const logData: Record<string, any> = {
      type: 'database_slow_query',
      query: this.truncateQuery(sanitizedSql),
      duration: this.formatDuration(duration),
      durationMs: duration,
      threshold: this.config.slowQueryThreshold,
      timestamp: new Date().toISOString()
    };

    if (this.config.includeParams && params) {
      logData.params = params;
    }

    const message = `Slow Database Query: ${this.truncateQuery(sanitizedSql)} - ${this.formatDuration(duration)} (threshold: ${this.config.slowQueryThreshold}ms)`;

    this.context.logger.warn(message, 'Database', logData);
  }

  destroy(): void {
    this.context = undefined;
  }
}

export function createDatabasePlugin(config?: DatabasePluginConfig): DatabaseQueryPlugin {
  return new DatabaseQueryPlugin(config);
}