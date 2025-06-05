/**
 * Universal Logger Performance Benchmark Suite
 * 
 * This script measures the performance impact of various logger configurations
 * and usage patterns to ensure minimal overhead in production environments.
 */

// Import dependencies
// Import the logger package
const { createLogger, LogLevel } = require('../../dist/index');

/**
 * Run a benchmark test with the given configuration
 * @param {string} name Test name
 * @param {Function} fn Function to benchmark
 * @param {number} iterations Number of iterations
 */
function runBenchmark(name, fn, iterations = 100000) {
  console.log(`\nRunning benchmark: ${name}`);
  console.log(`Iterations: ${iterations}`);
  
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn();
  }
  
  // Measure
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = process.hrtime.bigint();
  const durationNs = Number(end - start);
  const durationMs = durationNs / 1000000;
  const opsPerSecond = Math.floor((iterations / durationMs) * 1000);
  
  console.log(`Duration: ${durationMs.toFixed(2)}ms`);
  console.log(`Ops/sec: ${opsPerSecond.toLocaleString()}`);
  
  return {
    name,
    iterations,
    durationMs,
    opsPerSecond
  };
}

// Suppress console output during benchmarks
let originalConsole = undefined;

function suppressConsole() {
  // Store original methods only once
  if (!originalConsole) {
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
  }
  
  // Replace with no-op functions
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
}

function restoreConsole() {
  if (originalConsole) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
}

// Create simplified logger configurations for benchmarking
const disabledLogger = createLogger({ 
  minLevel: LogLevel.SILENT, 
  enabled: false 
});

const productionLogger = createLogger({ 
  minLevel: LogLevel.WARN, 
  enabled: true,
  showTimestamp: true,
  includeStackTrace: false,
  useColors: false
});

const developmentLogger = createLogger({ 
  minLevel: LogLevel.DEBUG, 
  enabled: true,
  showTimestamp: true,
  includeStackTrace: true,
  useColors: true
});

// Test data
const testMessage = "This is a test log message";
const testCategory = "benchmark";
const testObject = { 
  userId: "user123",
  action: "login",
  timestamp: new Date().toISOString(),
  metadata: {
    browser: "Chrome",
    version: "98.0.4758.102",
    platform: "Windows"
  }
};
const testError = new Error("Test error message");

// Test scenarios
const benchmarks = [];

// Run benchmark suite
async function runBenchmarkSuite() {
  console.log('\n🚀 Universal Logger Benchmark Suite');
  console.log('====================================');
  
  suppressConsole();
  
  try {
    // Benchmark 1: Disabled Logger (no output)
    runBenchmarkScenario('Disabled Logger', () => {
      disabledLogger.info('This is a test log message');
    }, 'Measures overhead of a completely disabled logger');
    
    // Benchmark 2: Production Logger (minimal features)
    runBenchmarkScenario('Production Logger', () => {
      productionLogger.warn('This is a test log message');
    }, 'Measures overhead with minimal features enabled');
    
    // Benchmark 3: Development Logger (all features)
    runBenchmarkScenario('Development Logger', () => {
      developmentLogger.debug('This is a test log message');
    }, 'Measures overhead with all features enabled');
    
    // Benchmark 4: Category Filtering
    // First enable all categories
    developmentLogger.enableAll();
    // Then disable specific category
    developmentLogger.disableCategory('benchmark');
    runBenchmarkScenario('Filtered Category', () => {
      developmentLogger.debug('benchmark', 'This filtered message should not appear');
    }, 'Measures overhead when a category is filtered out');
    
    // Benchmark 5: Error Logging
    runBenchmarkScenario('Error Logging', () => {
      productionLogger.error('This is a test error message');
    }, 'Measures overhead of error logging with stack traces');
    
    // Benchmark 6: Native Console (baseline comparison)
    runBenchmarkScenario('Native Console.log', () => {
      console.log('This is a test log message');
    }, 'Baseline comparison using native console.log', false);
    
    console.log('\n📊 Performance Summary');
    console.log('------------------------------------');
    console.log('The omni-log overhead varies based on configuration.');
    console.log('When disabled, it adds minimal overhead compared to direct console calls.');
    console.log('Development mode with all features has the highest overhead but provides the most value.');
    console.log('------------------------------------');
  } finally {
    restoreConsole();
  }
  
  console.log("\n====================================");
  console.log("Benchmark Results");
  console.log("====================================");
  
  benchmarks.forEach((result) => {
    console.log(`${result.name}: ${result.opsPerSecond.toLocaleString()} ops/sec`);
  });
  
  // Calculate overhead if we have the necessary benchmarks
  try {
    const nativeConsoleSpeed = benchmarks.find(b => b.name === "Native Console.log")?.opsPerSecond;
    const disabledLoggerSpeed = benchmarks.find(b => b.name === "Disabled Logger")?.opsPerSecond;
    const developmentLoggerSpeed = benchmarks.find(b => b.name === "Development Logger")?.opsPerSecond;
    
    if (nativeConsoleSpeed && disabledLoggerSpeed && developmentLoggerSpeed) {
      const disabledOverhead = 100 - (disabledLoggerSpeed / nativeConsoleSpeed * 100);
      const developmentOverhead = 100 - (developmentLoggerSpeed / nativeConsoleSpeed * 100);
      console.log(`\n- Disabled logger: ${disabledOverhead.toFixed(2)}% overhead vs. native console`);
      console.log(`- Full development logger: ${developmentOverhead.toFixed(2)}% overhead`);
    }
  } catch (err) {
    console.log("Could not calculate overhead statistics");
  }
}

// Run all benchmark scenarios
runBenchmarkSuite();

// Helper function to run a benchmark scenario
function runBenchmarkScenario(name, fn, description, useConsole = true) {
  if (useConsole) {
    console.log(`\n${name}: ${description}`);
  }
  const result = runBenchmark(name, fn);
  benchmarks.push(result);
}
