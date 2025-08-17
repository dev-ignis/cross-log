import { createApiPlugin } from '../../../src/plugins/api';
import { createLogger } from '../../../src';

describe('API Plugin', () => {
  let logger: any;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up spies before creating logger
    infoSpy = jest.spyOn(console, 'info').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    
    // Now create logger - it will use the mocked console methods
    logger = createLogger({ minLevel: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Plugin Registration', () => {
    it('should register API plugin', () => {
      const plugin = createApiPlugin();
      logger.use(plugin);
      
      expect(logger.api).toBeDefined();
      expect(logger.api?.request).toBeDefined();
      expect(logger.api?.response).toBeDefined();
      expect(logger.api?.error).toBeDefined();
    });

    it('should register with custom config', () => {
      const plugin = createApiPlugin({
        includeSessionId: false,
        truncateUrl: 50
      });
      logger.use(plugin);
      
      expect(logger.api).toBeDefined();
    });
  });

  describe('request method', () => {
    beforeEach(() => {
      const plugin = createApiPlugin();
      logger.use(plugin);
    });

    it('should log API requests', () => {
      logger.api?.request('GET', '/api/test', 100, 200);
      
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('API Request: GET /api/test');
      expect(call).toContain('200');
    });

    it('should log slow requests', () => {
      logger.api?.request('POST', '/api/slow', 5000, 200);
      
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('5.00s');
    });

    it('should handle error status codes', () => {
      logger.api?.request('GET', '/api/error', 100, 500);
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should truncate long URLs', () => {
      // Create a fresh logger for this test
      const freshLogger: any = createLogger({ minLevel: 0 });
      const plugin = createApiPlugin({ truncateUrl: 20 });
      freshLogger.use(plugin);
      
      const longUrl = '/api/very/long/url/that/should/be/truncated';
      freshLogger.api?.request('GET', longUrl, 100, 200);
      
      expect(infoSpy).toHaveBeenCalled();
      // Find the actual API request log (not plugin initialization)
      const apiCall = infoSpy.mock.calls.find(call => 
        call[0] && call[0].includes('API Request')
      );
      expect(apiCall).toBeDefined();
      expect(apiCall[0]).toContain('...');
    });
  });

  describe('response method', () => {
    beforeEach(() => {
      const plugin = createApiPlugin();
      logger.use(plugin);
    });

    it('should log API responses', () => {
      logger.api?.response('/api/test', 200, 100);
      
      expect(infoSpy).toHaveBeenCalled();
      const call = infoSpy.mock.calls[0][0];
      expect(call).toContain('API Response: /api/test');
      expect(call).toContain('200');
    });

    it('should log server errors', () => {
      logger.api?.response('/api/error', 500, 100);
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log client errors as warnings', () => {
      logger.api?.response('/api/notfound', 404, 50);
      
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('error method', () => {
    beforeEach(() => {
      const plugin = createApiPlugin();
      logger.use(plugin);
    });

    it('should log API errors with Error object', () => {
      const error = new Error('Network error');
      logger.api?.error('POST', '/api/fail', error, 500);
      
      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0][0];
      expect(call).toContain('API Error: POST /api/fail');
      expect(call).toContain('Network error');
    });

    it('should log API errors with string', () => {
      logger.api?.error('GET', '/api/fail', 'Connection timeout', 408);
      
      expect(errorSpy).toHaveBeenCalled();
      const call = errorSpy.mock.calls[0][0];
      expect(call).toContain('Connection timeout');
    });
  });

  describe('Session Management', () => {
    it('should generate session ID when enabled', () => {
      const plugin = createApiPlugin({ includeSessionId: true });
      logger.use(plugin);
      
      logger.api?.request('GET', '/api/test', 100, 200);
      logger.api?.request('GET', '/api/test2', 100, 200);
      
      // Both requests should have the same session in their data
      expect(infoSpy).toHaveBeenCalledTimes(2);
    });

    it('should not generate session ID when disabled', () => {
      const plugin = createApiPlugin({ includeSessionId: false });
      logger.use(plugin);
      
      logger.api?.request('GET', '/api/test', 100, 200);
      
      expect(infoSpy).toHaveBeenCalled();
    });
  });

  describe('Plugin Cleanup', () => {
    it('should clean up on destroy', () => {
      const plugin = createApiPlugin();
      logger.use(plugin);
      
      expect(logger.api).toBeDefined();
      
      plugin.destroy?.();
      // Plugin should still be attached to logger, but internal state cleared
      expect(plugin.name).toBe('api');
    });
  });
});