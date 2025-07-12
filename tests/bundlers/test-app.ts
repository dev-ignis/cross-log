// Test app to verify TypeScript imports and type inference
import logger, { createLogger, LogLevel, type PartialLoggerConfig } from 'cross-log';

// Test default logger
logger.info('Default logger works');
logger.debug('Debug message');

// Test custom logger with partial config
const customConfig: PartialLoggerConfig = {
  minLevel: LogLevel.DEBUG,
  colors: {
    enabled: true,
    browser: {
      debug: '#FF0000'
    }
  }
};

const customLogger = createLogger(customConfig);
customLogger.debug('Custom logger with partial config');

// Test type inference
const config = customLogger.getConfig();
console.log('Min level:', config.minLevel);

// Test method chaining
customLogger.setLevel(LogLevel.WARN);
customLogger.enableCategory('api', LogLevel.INFO);
customLogger.disableCategory('verbose');

// Test with Error object
try {
  throw new Error('Test error');
} catch (error) {
  customLogger.error(error as Error, 'error-test');
}

// Export for verification
export { customLogger };