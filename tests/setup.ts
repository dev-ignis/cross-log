/**
 * Jest test setup
 */

// Mock console to avoid noise in test output
global.console = {
  ...console,
  // Keep error and warn for actual test failures
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error
};

// Mock setTimeout and clearTimeout for debounce tests
global.setTimeout = jest.fn((fn, delay) => {
  return setTimeout(fn, delay);
}) as any;

global.clearTimeout = jest.fn(clearTimeout);

// Setup for jsdom-like environment when needed
if (typeof window === 'undefined') {
  // Add minimal browser globals for cross-environment tests
  (global as any).window = undefined;
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});