import { createLogger } from '../../../src';
import { 
  createAnalyticsPlugin,
  createPerformancePlugin,
  createSecurityPlugin
} from '../../../src/plugins';

describe('Plugin System', () => {
  let logger: any;
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up spies before creating logger
    debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Now create logger
    logger = createLogger({ minLevel: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Analytics Plugin', () => {
    it('should register and use analytics plugin', () => {
      const plugin = createAnalyticsPlugin({
        providers: ['google', 'facebook'],
        includeUserContext: true
      });
      
      logger.use(plugin);
      expect(logger.analytics).toBeDefined();
      
      // Test methods
      logger.analytics?.event('button_click', 'google', { button: 'submit' });
      logger.analytics?.pageView('/home', 'facebook');
      logger.analytics?.conversion('purchase', 99.99, 'google');
      logger.analytics?.identify('user123', { name: 'John' });
      
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should warn for invalid provider', () => {
      const plugin = createAnalyticsPlugin({
        providers: ['google']
      });
      
      logger.use(plugin);
      logger.analytics?.event('test', 'invalid_provider');
      
      expect(warnSpy).toHaveBeenCalled();
      const call = warnSpy.mock.calls[0][0];
      expect(call).toContain('not configured');
    });

    it('should handle browser environment', () => {
      // Mock browser environment
      const originalWindow = global.window;
      global.window = {
        navigator: {
          userAgent: 'Mozilla/5.0',
          language: 'en-US',
          platform: 'MacIntel'
        },
        screen: { width: 1920, height: 1080 },
        innerWidth: 1024,
        innerHeight: 768,
        location: { href: 'http://test.com' }
      } as any;
      global.document = { referrer: 'http://referrer.com' } as any;
      
      const plugin = createAnalyticsPlugin({ includeUserContext: true });
      logger.use(plugin);
      
      logger.analytics?.event('page_load');
      
      // Restore
      global.window = originalWindow;
      (global as any).document = undefined;
      
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      const plugin = createAnalyticsPlugin();
      logger.use(plugin);
      
      plugin.destroy();
      expect(plugin.name).toBe('analytics');
    });
  });

  describe('Performance Plugin', () => {
    it('should register and use performance plugin', () => {
      const plugin = createPerformancePlugin({
        webVitals: true,
        resourceTiming: true,
        thresholds: {
          fcp: 1000,
          lcp: 2000
        }
      });
      
      logger.use(plugin);
      expect(logger.performance).toBeDefined();
      
      // Test methods
      logger.performance?.measure('api_call', 250);
      logger.performance?.mark('page_start');
      logger.performance?.webVitals({ fcp: 1200, lcp: 2100, cls: 0.05 });
      logger.performance?.resource('script.js', 'script', 150, 5000);
      logger.performance?.cache('hit', 'key123');
      logger.performance?.cache('miss', 'key456', 10);
      
      expect(infoSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
    });

    it('should warn for slow web vitals', () => {
      const plugin = createPerformancePlugin({
        webVitals: true,
        thresholds: {
          fcp: 1000,
          lcp: 2000,
          cls: 0.1
        }
      });
      
      logger.use(plugin);
      
      // Exceeds thresholds
      logger.performance?.webVitals({ 
        fcp: 1500,
        lcp: 3000,
        cls: 0.2
      });
      
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should track marks with duration', () => {
      const plugin = createPerformancePlugin();
      logger.use(plugin);
      
      // Mock performance.now with Object.defineProperty
      let now = 0;
      const originalNow = performance.now;
      Object.defineProperty(performance, 'now', {
        configurable: true,
        value: () => now
      });
      
      logger.performance?.mark('start');
      now = 1000;
      logger.performance?.mark('start');
      
      // Restore original
      Object.defineProperty(performance, 'now', {
        configurable: true,
        value: originalNow
      });
      
      expect(debugSpy).toHaveBeenCalled();
      // Check that one of the calls contains the expected text
      const calls = debugSpy.mock.calls;
      const hasExpectedCall = calls.some(call => 
        call[0] && call[0].includes('1.00s since last')
      );
      expect(hasExpectedCall).toBe(true);
    });

    it('should warn for slow resources', () => {
      const plugin = createPerformancePlugin({ resourceTiming: true });
      logger.use(plugin);
      
      logger.performance?.resource('large-file.js', 'script', 4000, 100000);
      
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should observe web vitals in browser', () => {
      // Mock browser with PerformanceObserver
      const originalWindow = global.window;
      const mockObserver = {
        observe: jest.fn()
      };
      
      global.window = {} as any;
      global.PerformanceObserver = jest.fn(() => mockObserver) as any;
      
      const plugin = createPerformancePlugin({ webVitals: true });
      logger.use(plugin);
      
      expect(mockObserver.observe).toHaveBeenCalled();
      
      // Restore
      global.window = originalWindow;
      (global as any).PerformanceObserver = undefined;
    });

    it('should clean up on destroy', () => {
      const plugin = createPerformancePlugin();
      logger.use(plugin);
      
      plugin.destroy();
      expect(plugin.name).toBe('performance');
    });
  });

  describe('Security Plugin', () => {
    it('should register and use security plugin', () => {
      const plugin = createSecurityPlugin({
        severity: true,
        includeUserAgent: true
      });
      
      logger.use(plugin);
      expect(logger.security).toBeDefined();
      
      // Test methods
      logger.security?.event('login_attempt', 'low');
      logger.security?.authFailure('Invalid password', 'user@test.com');
      logger.security?.authSuccess('user123', '2fa');
      logger.security?.accessDenied('/admin', 'user456', 'No permission');
      logger.security?.suspiciousActivity('port_scan');
      logger.security?.vulnerability('xss', 'high', { url: '/search' });
      
      expect(infoSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should track failed auth attempts', () => {
      const plugin = createSecurityPlugin();
      logger.use(plugin);
      
      // Multiple failures
      logger.security?.authFailure('wrong_password', 'user1');
      logger.security?.authFailure('wrong_password', 'user1');
      logger.security?.authFailure('wrong_password', 'user1');
      
      expect(warnSpy).toHaveBeenCalled();
      
      // 5+ failures triggers suspicious activity
      logger.security?.authFailure('wrong_password', 'user1');
      logger.security?.authFailure('wrong_password', 'user1');
      
      expect(errorSpy).toHaveBeenCalled();
      // Check that one of the error calls contains suspicious activity
      const errorCalls = errorSpy.mock.calls;
      const hasSuspiciousActivity = errorCalls.some(call => 
        call[0] && call[0].includes('Suspicious Activity')
      );
      expect(hasSuspiciousActivity).toBe(true);
    });

    it('should reset failed attempts on success', () => {
      const plugin = createSecurityPlugin();
      logger.use(plugin);
      
      logger.security?.authFailure('wrong', 'user1');
      logger.security?.authFailure('wrong', 'user1');
      logger.security?.authSuccess('user1', 'password');
      
      // Should reset counter - this will be Attempt #1 again
      logger.security?.authFailure('wrong', 'user1');
      
      // Check all spy calls to find the one with "Attempt #1"
      const allCalls = [...infoSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls];
      const hasAttempt1 = allCalls.some(call => 
        call[0] && typeof call[0] === 'string' && call[0].includes('Attempt #1')
      );
      expect(hasAttempt1).toBe(true);
    });

    it('should handle different severity levels', () => {
      const plugin = createSecurityPlugin({ severity: true });
      logger.use(plugin);
      
      logger.security?.event('test_low', 'low');
      expect(infoSpy).toHaveBeenCalled();
      
      logger.security?.event('test_medium', 'medium');
      expect(warnSpy).toHaveBeenCalled();
      
      logger.security?.event('test_high', 'high');
      logger.security?.event('test_critical', 'critical');
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should include browser context', () => {
      const originalWindow = global.window;
      global.window = {
        navigator: { userAgent: 'TestBrowser' },
        location: { origin: 'http://test.com', pathname: '/test' }
      } as any;
      
      const plugin = createSecurityPlugin({ includeUserAgent: true });
      logger.use(plugin);
      
      logger.security?.event('test');
      
      global.window = originalWindow;
      
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should include process context', () => {
      const plugin = createSecurityPlugin();
      logger.use(plugin);
      
      logger.security?.event('test');
      
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      const plugin = createSecurityPlugin();
      logger.use(plugin);
      
      plugin.destroy();
      expect(plugin.name).toBe('security');
    });
  });

  describe('Logger Integration', () => {
    it('should work with logger.use method', () => {
      const apiPlugin = createAnalyticsPlugin();
      const perfPlugin = createPerformancePlugin();
      const secPlugin = createSecurityPlugin();
      
      logger.use(apiPlugin);
      logger.use(perfPlugin);
      logger.use(secPlugin);
      
      expect(logger.analytics).toBeDefined();
      expect(logger.performance).toBeDefined();
      expect(logger.security).toBeDefined();
    });

    it('should retrieve plugin instance', () => {
      const plugin = createAnalyticsPlugin();
      logger.use(plugin);
      
      const instance = logger.getPlugin('analytics');
      expect(instance).toBeDefined();
      expect(instance.plugin.name).toBe('analytics');
    });
  });
});