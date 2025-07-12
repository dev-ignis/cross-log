/**
 * Tests for environment detection and abstraction
 */

import {
  detectRuntimeType,
  RuntimeType,
  getEnvironmentVariable,
  isProductionEnvironment,
  detectEnvironment,
  getHighResolutionTime,
  hasGlobal
} from '../../../src/core/environment';

describe('Environment Detection', () => {
  // Save original values
  const originalWindow = (global as any).window;
  const originalProcess = (global as any).process;
  const originalDeno = (global as any).Deno;
  const originalBun = (global as any).Bun;
  const originalFetch = (global as any).fetch;
  const originalCaches = (global as any).caches;
  const originalPerformance = (global as any).performance;

  afterEach(() => {
    // Restore original values
    (global as any).window = originalWindow;
    (global as any).process = originalProcess;
    (global as any).Deno = originalDeno;
    (global as any).Bun = originalBun;
    (global as any).fetch = originalFetch;
    (global as any).caches = originalCaches;
    (global as any).performance = originalPerformance;
  });

  describe('detectRuntimeType', () => {
    test('detects browser environment', () => {
      (global as any).window = { document: {} };
      delete (global as any).process;
      
      expect(detectRuntimeType()).toBe(RuntimeType.BROWSER);
    });

    test('detects Node.js environment', () => {
      delete (global as any).window;
      (global as any).process = { versions: { node: '16.0.0' } };
      
      expect(detectRuntimeType()).toBe(RuntimeType.NODE);
    });

    test('detects Edge Runtime environment', () => {
      delete (global as any).window;
      delete (global as any).process;
      (global as any).fetch = () => {};
      
      expect(detectRuntimeType()).toBe(RuntimeType.EDGE);
    });

    test('detects Cloudflare Workers environment', () => {
      delete (global as any).window;
      delete (global as any).process;
      (global as any).caches = {};
      
      expect(detectRuntimeType()).toBe(RuntimeType.EDGE);
    });

    test('detects Deno environment', () => {
      delete (global as any).window;
      (global as any).Deno = { env: { get: () => {} } };
      
      expect(detectRuntimeType()).toBe(RuntimeType.DENO);
    });

    test('detects Bun environment', () => {
      delete (global as any).window;
      (global as any).Bun = {};
      
      expect(detectRuntimeType()).toBe(RuntimeType.BUN);
    });

    test('returns unknown for unrecognized environment', () => {
      delete (global as any).window;
      delete (global as any).process;
      delete (global as any).Deno;
      delete (global as any).Bun;
      delete (global as any).fetch;
      delete (global as any).caches;
      
      expect(detectRuntimeType()).toBe(RuntimeType.UNKNOWN);
    });
  });

  describe('getEnvironmentVariable', () => {
    test('gets environment variable in Node.js', () => {
      (global as any).process = {
        versions: { node: '16.0.0' },
        env: { TEST_VAR: 'test_value' }
      };
      
      expect(getEnvironmentVariable('TEST_VAR')).toBe('test_value');
    });

    test('returns default value when variable not found', () => {
      (global as any).process = {
        versions: { node: '16.0.0' },
        env: {}
      };
      
      expect(getEnvironmentVariable('MISSING_VAR', 'default')).toBe('default');
    });

    test('gets environment variable in Edge Runtime', () => {
      delete (global as any).process;
      (global as any).fetch = () => {};
      (global as any).TEST_VAR = 'edge_value';
      
      expect(getEnvironmentVariable('TEST_VAR')).toBe('edge_value');
    });

    test('gets environment variable in Deno', () => {
      delete (global as any).process;
      (global as any).Deno = {
        env: {
          get: (key: string) => key === 'TEST_VAR' ? 'deno_value' : undefined
        }
      };
      
      expect(getEnvironmentVariable('TEST_VAR')).toBe('deno_value');
    });

    test('returns default in browser environment', () => {
      (global as any).window = { document: {} };
      delete (global as any).process;
      
      expect(getEnvironmentVariable('TEST_VAR', 'browser_default')).toBe('browser_default');
    });

    test('reads from window.__ENV__ in browser if available', () => {
      (global as any).window = {
        document: {},
        __ENV__: { TEST_VAR: 'browser_env_value' }
      };
      delete (global as any).process;
      
      expect(getEnvironmentVariable('TEST_VAR')).toBe('browser_env_value');
    });
  });

  describe('isProductionEnvironment', () => {
    beforeEach(() => {
      (global as any).process = {
        versions: { node: '16.0.0' },
        env: {}
      };
    });

    test('detects production via NODE_ENV', () => {
      (global as any).process.env.NODE_ENV = 'production';
      expect(isProductionEnvironment()).toBe(true);
    });

    test('detects production via ENVIRONMENT', () => {
      (global as any).process.env.ENVIRONMENT = 'production';
      expect(isProductionEnvironment()).toBe(true);
    });

    test('detects production via ENVIRONMENT=prod', () => {
      (global as any).process.env.ENVIRONMENT = 'prod';
      expect(isProductionEnvironment()).toBe(true);
    });

    test('detects production via VERCEL_ENV', () => {
      (global as any).process.env.VERCEL_ENV = 'production';
      expect(isProductionEnvironment()).toBe(true);
    });

    test('detects production via Cloudflare Pages', () => {
      (global as any).process.env.CF_PAGES = '1';
      (global as any).process.env.CF_PAGES_BRANCH = 'main';
      expect(isProductionEnvironment()).toBe(true);
    });

    test('returns false when not production', () => {
      (global as any).process.env.NODE_ENV = 'development';
      expect(isProductionEnvironment()).toBe(false);
    });

    test('returns false when no environment indicators', () => {
      expect(isProductionEnvironment()).toBe(false);
    });
  });

  describe('detectEnvironment', () => {
    test('returns correct environment object for Node.js', () => {
      delete (global as any).window;
      (global as any).process = {
        versions: { node: '16.0.0' },
        env: { NODE_ENV: 'development' }
      };
      
      const env = detectEnvironment();
      expect(env.isBrowser).toBe(false);
      expect(env.isNode).toBe(true);
      expect(env.isDevelopment).toBe(true);
      expect(env.isProduction).toBe(false);
      expect(env.runtime).toBe(RuntimeType.NODE);
    });

    test('returns correct environment object for browser', () => {
      (global as any).window = { document: {} };
      delete (global as any).process;
      
      const env = detectEnvironment();
      expect(env.isBrowser).toBe(true);
      expect(env.isNode).toBe(false);
      expect(env.runtime).toBe(RuntimeType.BROWSER);
    });

    test('returns correct environment object for Edge Runtime', () => {
      delete (global as any).window;
      delete (global as any).process;
      (global as any).fetch = () => {};
      
      const env = detectEnvironment();
      expect(env.isBrowser).toBe(false);
      expect(env.isNode).toBe(false);
      expect(env.runtime).toBe(RuntimeType.EDGE);
    });
  });

  describe('getHighResolutionTime', () => {
    test('uses performance.now when available', () => {
      const mockNow = jest.fn().mockReturnValue(123.456);
      (global as any).performance = { now: mockNow };
      
      const time = getHighResolutionTime();
      expect(mockNow).toHaveBeenCalled();
      expect(time).toBe(123.456);
    });

    test('falls back to Date.now when performance not available', () => {
      delete (global as any).performance;
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(1234567890);
      
      const time = getHighResolutionTime();
      expect(Date.now).toHaveBeenCalled();
      expect(time).toBe(1234567890);
      
      Date.now = originalDateNow;
    });
  });

  describe('hasGlobal', () => {
    test('returns true when global exists', () => {
      (global as any).testGlobal = 'exists';
      expect(hasGlobal('testGlobal')).toBe(true);
    });

    test('returns false when global does not exist', () => {
      delete (global as any).nonExistentGlobal;
      expect(hasGlobal('nonExistentGlobal')).toBe(false);
    });

    test('handles errors gracefully', () => {
      // Test with undefined global
      delete (global as any).undefinedGlobal;
      expect(hasGlobal('undefinedGlobal')).toBe(false);
    });
  });
});