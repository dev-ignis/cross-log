import { Plugin, PluginContext, SecurityPlugin, SecurityPluginConfig, SecuritySeverity, PluginInstance } from './types';

export class SecurityEventPlugin implements Plugin<SecurityPluginConfig> {
  name = 'security';
  version = '1.0.0';
  config: SecurityPluginConfig;
  private context?: PluginContext;
  private failedAttempts: Map<string, number> = new Map();

  constructor(config?: SecurityPluginConfig) {
    this.config = {
      enabled: true,
      severity: true,
      includeIpAddress: false,
      includeUserAgent: true,
      ...config
    };
  }

  init(context: PluginContext): void {
    this.context = context;

    const methods: SecurityPlugin = {
      event: this.event.bind(this),
      authFailure: this.authFailure.bind(this),
      authSuccess: this.authSuccess.bind(this),
      accessDenied: this.accessDenied.bind(this),
      suspiciousActivity: this.suspiciousActivity.bind(this),
      vulnerability: this.vulnerability.bind(this)
    };

    (context as any).methods = methods;
    
    const instance = context as unknown as PluginInstance;
    instance.methods = methods as any;
  }

  private getSecurityContext(): Record<string, any> {
    const context: Record<string, any> = {
      timestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      if (this.config.includeUserAgent) {
        context.userAgent = window.navigator.userAgent;
      }
      context.origin = window.location.origin;
      context.path = window.location.pathname;
    }

    if (typeof process !== 'undefined') {
      context.processId = process.pid;
      context.platform = process.platform;
    }

    return context;
  }

  private getSeverityLevel(severity: SecuritySeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  private getSeverityEmoji(severity: SecuritySeverity): string {
    switch (severity) {
      case 'low':
        return '🔵';
      case 'medium':
        return '🟡';
      case 'high':
        return '🟠';
      case 'critical':
        return '🔴';
      default:
        return '⚪';
    }
  }

  event(type: string, severity?: SecuritySeverity, details?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'security_event',
      eventType: type,
      ...this.getSecurityContext()
    };

    if (this.config.severity && severity) {
      logData.severity = severity;
      logData.severityEmoji = this.getSeverityEmoji(severity);
    }

    if (details) {
      logData.details = details;
    }

    const message = `Security Event: ${type}${severity ? ` [${severity.toUpperCase()}]` : ''}`;

    const level = severity ? this.getSeverityLevel(severity) : 'info';
    
    if (level === 'error') {
      this.context.logger.error(message, 'Security', logData);
    } else if (level === 'warn') {
      this.context.logger.warn(message, 'Security', logData);
    } else {
      this.context.logger.info(message, 'Security', logData);
    }
  }

  authFailure(reason: string, userId?: string, details?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const key = userId || 'unknown';
    const attempts = (this.failedAttempts.get(key) || 0) + 1;
    this.failedAttempts.set(key, attempts);

    const logData: Record<string, any> = {
      type: 'auth_failure',
      reason,
      failedAttempts: attempts,
      ...this.getSecurityContext()
    };

    if (userId) {
      logData.userId = userId;
    }

    if (details) {
      logData.details = details;
    }

    const severity: SecuritySeverity = attempts >= 5 ? 'high' : attempts >= 3 ? 'medium' : 'low';
    
    if (this.config.severity) {
      logData.severity = severity;
      logData.severityEmoji = this.getSeverityEmoji(severity);
    }

    const message = `Authentication Failure: ${reason}${userId ? ` (User: ${userId})` : ''} - Attempt #${attempts}`;

    const level = this.getSeverityLevel(severity);
    
    if (level === 'error') {
      this.context.logger.error(message, 'Security', logData);
    } else if (level === 'warn') {
      this.context.logger.warn(message, 'Security', logData);
    } else {
      this.context.logger.info(message, 'Security', logData);
    }

    if (attempts >= 5) {
      this.suspiciousActivity('multiple_auth_failures', { userId, attempts });
    }
  }

  authSuccess(userId: string, method?: string, details?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    this.failedAttempts.delete(userId);

    const logData: Record<string, any> = {
      type: 'auth_success',
      userId,
      ...this.getSecurityContext()
    };

    if (method) {
      logData.authMethod = method;
    }

    if (details) {
      logData.details = details;
    }

    const message = `Authentication Success: User ${userId}${method ? ` via ${method}` : ''}`;

    this.context.logger.info(message, 'Security', logData);
  }

  accessDenied(resource: string, userId?: string, reason?: string): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'access_denied',
      resource,
      ...this.getSecurityContext()
    };

    if (userId) {
      logData.userId = userId;
    }

    if (reason) {
      logData.reason = reason;
    }

    if (this.config.severity) {
      logData.severity = 'medium';
      logData.severityEmoji = this.getSeverityEmoji('medium');
    }

    const message = `Access Denied: ${resource}${userId ? ` (User: ${userId})` : ''}${reason ? ` - ${reason}` : ''}`;

    this.context.logger.warn(message, 'Security', logData);
  }

  suspiciousActivity(type: string, details?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'suspicious_activity',
      activityType: type,
      ...this.getSecurityContext()
    };

    if (details) {
      logData.details = details;
    }

    if (this.config.severity) {
      logData.severity = 'high';
      logData.severityEmoji = this.getSeverityEmoji('high');
    }

    const message = `⚠️ Suspicious Activity Detected: ${type}`;

    this.context.logger.error(message, 'Security', logData);
  }

  vulnerability(type: string, severity: SecuritySeverity, details?: Record<string, any>): void {
    if (!this.context || !this.config.enabled) return;

    const logData: Record<string, any> = {
      type: 'vulnerability_detected',
      vulnerabilityType: type,
      ...this.getSecurityContext()
    };

    if (this.config.severity) {
      logData.severity = severity;
      logData.severityEmoji = this.getSeverityEmoji(severity);
    }

    if (details) {
      logData.details = details;
    }

    const message = `🛡️ Vulnerability Detected: ${type} [${severity.toUpperCase()}]`;

    const level = this.getSeverityLevel(severity);
    
    if (level === 'error') {
      this.context.logger.error(message, 'Security', logData);
    } else if (level === 'warn') {
      this.context.logger.warn(message, 'Security', logData);
    } else {
      this.context.logger.info(message, 'Security', logData);
    }
  }

  destroy(): void {
    this.context = undefined;
    this.failedAttempts.clear();
  }
}

export function createSecurityPlugin(config?: SecurityPluginConfig): SecurityEventPlugin {
  return new SecurityEventPlugin(config);
}