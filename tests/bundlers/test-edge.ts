// Test Edge Runtime adapter
import logger, { createEdgeLogger, LogLevel, type PartialLoggerConfig } from 'cross-log/edge';
import type { ILogger } from 'cross-log/edge';

// Test default edge logger
logger.info('Edge logger works');

// Test custom edge logger
const config: PartialLoggerConfig = {
  minLevel: LogLevel.INFO,
  showTimestamp: false
};

const customEdge = createEdgeLogger(config);
customEdge.info('Custom edge logger');

// Type check
const edgeLogger: ILogger = customEdge;
edgeLogger.warn('Type-checked logger');

// Test in simulated edge function
export default function handler(request: Request) {
  logger.info(`Edge function called: ${request.method} ${request.url}`);
  
  return new Response('OK', { status: 200 });
}