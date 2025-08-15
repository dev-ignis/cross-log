import { createLogger, plugins } from 'cross-log';

// Example 1: Basic plugin usage
const logger = createLogger();

// Add individual plugins
logger.use(plugins.api());
logger.use(plugins.database({ truncateQueries: 100 }));
logger.use(plugins.analytics({ providers: ['google', 'facebook'] }));
logger.use(plugins.performance({ webVitals: true }));
logger.use(plugins.security({ severity: true }));

// Example 2: API Request Logging
logger.api?.request('GET', '/api/users', 120, 200);
logger.api?.response('/api/users', 200, 120, { users: [] });
logger.api?.error('POST', '/api/login', new Error('Invalid credentials'), 401);

// Example 3: Database Query Logging
logger.database?.query('SELECT * FROM users WHERE active = ?', 45, 10, [true]);
logger.database?.error('INSERT INTO logs', new Error('Connection lost'));
logger.database?.transaction('tx_123', 'begin');
logger.database?.transaction('tx_123', 'commit', 230);
logger.database?.slowQuery('SELECT * FROM orders JOIN products', 5000);

// Example 4: Analytics Events
logger.analytics?.event('button_click', 'google', { button: 'subscribe' });
logger.analytics?.pageView('/home', 'facebook');
logger.analytics?.conversion('purchase', 99.99, 'mixpanel', { product: 'premium' });
logger.analytics?.identify('user_123', { name: 'John Doe', plan: 'premium' });

// Example 5: Performance Metrics
logger.performance?.measure('api_call', 450);
logger.performance?.mark('page_load_start');
logger.performance?.mark('page_load_end');
logger.performance?.webVitals({ fcp: 1200, lcp: 2100, cls: 0.05 });
logger.performance?.resource('script.js', 'script', 230, 45000);
logger.performance?.cache('hit', 'user_123');
logger.performance?.cache('miss', 'product_456', 12);

// Example 6: Security Events
logger.security?.event('login_attempt', 'medium');
logger.security?.authFailure('Invalid password', 'user@example.com');
logger.security?.authSuccess('user_123', '2fa');
logger.security?.accessDenied('/admin', 'user_456', 'Insufficient privileges');
logger.security?.suspiciousActivity('multiple_login_failures', { attempts: 5 });
logger.security?.vulnerability('sql_injection', 'high', { endpoint: '/api/search' });

// Example 7: Advanced Configuration with Multiple Plugins
const advancedLogger = createLogger({
  minLevel: 1, // INFO level
  showTimestamp: true,
  categories: {
    API: { enabled: true, minLevel: 0 },
    Database: { enabled: true, minLevel: 1 },
    Security: { enabled: true, minLevel: 0 }
  }
});

// Configure plugins with specific settings
advancedLogger.use(plugins.api({
  includeSessionId: true,
  includeHeaders: false,
  truncateUrl: 150
}));

advancedLogger.use(plugins.database({
  truncateQueries: 200,
  includeParams: true,
  slowQueryThreshold: 1000
}));

advancedLogger.use(plugins.analytics({
  providers: ['google', 'facebook', 'segment'],
  includeUserContext: true
}));

advancedLogger.use(plugins.performance({
  webVitals: true,
  resourceTiming: true,
  thresholds: {
    fcp: 1500,
    lcp: 2000,
    fid: 50,
    cls: 0.05,
    ttfb: 600
  }
}));

advancedLogger.use(plugins.security({
  severity: true,
  includeIpAddress: false,
  includeUserAgent: true
}));

// Example 8: Real-world API middleware integration
async function apiMiddleware(req: any, res: any, next: any) {
  const startTime = Date.now();
  const method = req.method;
  const url = req.url;

  // Log the incoming request
  advancedLogger.api?.request(method, url);

  // Capture the response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Log the response
    advancedLogger.api?.response(url, status, duration);

    // Log slow requests as performance issues
    if (duration > 1000) {
      advancedLogger.performance?.measure(`Slow API: ${url}`, duration);
    }

    return originalSend.call(this, data);
  };

  // Handle errors
  try {
    await next();
  } catch (error) {
    const duration = Date.now() - startTime;
    advancedLogger.api?.error(method, url, error as Error, 500);
    throw error;
  }
}

// Example 9: Database transaction with logging
async function performDatabaseTransaction() {
  const transactionId = `tx_${Date.now()}`;
  
  try {
    advancedLogger.database?.transaction(transactionId, 'begin');
    
    // Simulate database operations
    const queryStart = Date.now();
    // await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [123]);
    const queryDuration = Date.now() - queryStart;
    
    advancedLogger.database?.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      queryDuration,
      1,
      [123]
    );
    
    advancedLogger.database?.transaction(transactionId, 'commit', Date.now() - queryStart);
  } catch (error) {
    advancedLogger.database?.transaction(transactionId, 'rollback');
    advancedLogger.database?.error('Transaction failed', error as Error);
    throw error;
  }
}

// Example 10: Monitoring user interactions
function trackUserInteraction(action: string, element: string, value?: any) {
  // Log to analytics
  advancedLogger.analytics?.event(action, 'google', {
    element,
    value,
    timestamp: new Date().toISOString()
  });

  // Track performance if it's a critical interaction
  if (action === 'page_navigation') {
    advancedLogger.performance?.mark(`navigation_to_${value}`);
  }

  // Security tracking for sensitive actions
  if (action === 'password_change' || action === 'account_delete') {
    advancedLogger.security?.event(action, 'high', {
      userId: value?.userId,
      timestamp: new Date().toISOString()
    });
  }
}

// Example 11: Web Vitals monitoring in browser
if (typeof window !== 'undefined') {
  // Monitor Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        advancedLogger.performance?.webVitals({ fcp: entry.startTime });
      }
    }
  });
  
  observer.observe({ entryTypes: ['paint'] });

  // Monitor resource loading
  window.addEventListener('load', () => {
    const resources = performance.getEntriesByType('resource');
    resources.forEach((resource: any) => {
      advancedLogger.performance?.resource(
        resource.name,
        resource.initiatorType,
        resource.duration,
        resource.transferSize
      );
    });
  });
}

// Example 12: Security monitoring
class SecurityMonitor {
  private failedAttempts = new Map<string, number>();

  async handleLogin(username: string, password: string) {
    try {
      // Simulate authentication
      const user = await this.authenticate(username, password);
      
      advancedLogger.security?.authSuccess(user.id, 'password');
      this.failedAttempts.delete(username);
      
      return user;
    } catch (error) {
      const attempts = (this.failedAttempts.get(username) || 0) + 1;
      this.failedAttempts.set(username, attempts);
      
      advancedLogger.security?.authFailure('Invalid credentials', username);
      
      if (attempts >= 3) {
        advancedLogger.security?.suspiciousActivity('brute_force_attempt', {
          username,
          attempts,
          ip: this.getClientIp()
        });
      }
      
      throw error;
    }
  }

  private async authenticate(username: string, password: string): Promise<any> {
    // Simulate authentication logic
    throw new Error('Not implemented');
  }

  private getClientIp(): string {
    // Get client IP logic
    return '127.0.0.1';
  }
}

// Export for use in other modules
export { logger, advancedLogger, apiMiddleware, performDatabaseTransaction, trackUserInteraction };