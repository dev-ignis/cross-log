/**
 * Example: Using universal-logger in Next.js
 * This example shows how the Next.js adapter automatically detects
 * whether code is running in Edge Runtime or Node.js runtime
 */

// Import the Next.js adapter
// In a real project: import logger from 'cross-log/next';
import logger from '../dist/adapters/next.js';

// The logger automatically detects the runtime:
// - Edge Runtime for middleware and edge API routes
// - Node.js runtime for regular API routes and SSR

// Example 1: Next.js Middleware (runs in Edge Runtime)
export function middleware(request) {
  logger.info(`Middleware: ${request.method} ${request.url}`, 'middleware');
  
  // The logger knows it's in Edge Runtime and won't use Node.js APIs
  return NextResponse.next();
}

// Example 2: API Route (can run in either runtime)
export default function handler(req, res) {
  logger.info(`API Route: ${req.method} ${req.url}`, 'api');
  
  try {
    // Your API logic here
    const result = processRequest(req);
    logger.debug('Request processed successfully', 'api');
    res.status(200).json(result);
  } catch (error) {
    logger.error(error, 'api');
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Example 3: React Server Component (runs in Node.js)
export async function ServerComponent() {
  logger.info('Rendering server component', 'react');
  
  const data = await fetchData();
  logger.debug(`Fetched ${data.length} items`, 'react');
  
  return <div>{/* Component JSX */}</div>;
}

// Example 4: Edge API Route
export const config = {
  runtime: 'edge', // This forces Edge Runtime
};

export async function edgeHandler(request) {
  // Logger automatically uses Edge-compatible implementation
  logger.info('Edge API route called', 'edge-api');
  
  return new Response('Hello from Edge Runtime!');
}

function processRequest(req) {
  // Stub function for example
  return { success: true };
}

function fetchData() {
  // Stub function for example
  return Promise.resolve([{ id: 1 }, { id: 2 }]);
}

console.log('\n✅ Next.js logger example completed successfully!');