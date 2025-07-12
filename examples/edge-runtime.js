/**
 * Example: Using universal-logger in Edge Runtime environments
 * This example demonstrates how to use the logger in Vercel Edge Functions,
 * Cloudflare Workers, and other Edge Runtime environments.
 */

// Import the Edge-specific logger
// In a real project: import logger from 'cross-log/edge';
import logger from '../dist/adapters/edge.js';

// The logger automatically detects the Edge Runtime environment
// and avoids using Node.js-specific APIs

// Basic logging
logger.debug('Debug message in Edge Runtime');
logger.info('Info message in Edge Runtime');
logger.warn('Warning message in Edge Runtime');
logger.error('Error message in Edge Runtime');

// Logging with categories
logger.info('User logged in', 'auth');
logger.error('Database connection failed', 'database');

// Configure the logger
logger.configure({
  minLevel: logger.Level.INFO,
  showTimestamp: false
});

// Now debug messages won't be shown
logger.debug('This will not be logged');
logger.info('This will be logged');

// Error handling
try {
  throw new Error('Something went wrong in Edge Runtime');
} catch (error) {
  logger.error(error, 'edge-error');
}

// The Edge logger automatically disables features that aren't available:
// - File system logging (no fs module)
// - Local storage (not available in Edge Runtime)
// - Browser-specific features (window object)

console.log('\n✅ Edge Runtime logger example completed successfully!');