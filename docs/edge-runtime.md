# Edge Runtime Support

Cross-log v0.4.0 introduces full support for Edge Runtime environments, including Vercel Edge Functions and Cloudflare Workers.

## Overview

Edge Runtime environments have restrictions compared to Node.js:
- No access to Node.js APIs (fs, path, process, etc.)
- Limited global objects
- Different environment variable access patterns
- Performance-oriented constraints

Cross-log handles these differences automatically when you use the appropriate entry point.

## Installation

```bash
npm install cross-log
```

## Framework-Specific Entry Points

### Edge Runtime
```typescript
import logger from 'cross-log/edge';
```
Use this for:
- Vercel Edge Functions
- Cloudflare Workers
- Deno Deploy
- Any Edge Runtime environment

### Next.js
```typescript
import logger from 'cross-log/next';
```
Automatically detects and uses the appropriate logger:
- EdgeLogger in middleware and Edge API routes
- NodeLogger in regular API routes and server-side rendering

### Node.js
```typescript
import logger from 'cross-log/node';
```
Full Node.js features including:
- ANSI colors in terminal
- Complete process access
- File system operations (if needed)

### Browser
```typescript
import logger from 'cross-log/browser';
```
Browser-optimized with:
- localStorage persistence
- Browser console colors
- Window namespace controls

## Usage Examples

### Vercel Edge Function
```typescript
import logger from 'cross-log/edge';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  logger.info(`Edge function called: ${request.method} ${request.url}`);
  
  try {
    // Your edge function logic
    const data = await processRequest(request);
    logger.debug('Request processed', 'api', { dataSize: data.length });
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error(error as Error, 'api');
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### Cloudflare Worker
```typescript
import logger from 'cross-log/edge';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    logger.info('Worker received request', 'worker');
    
    try {
      const response = await handleRequest(request, env);
      return response;
    } catch (error) {
      logger.error(error as Error, 'worker');
      return new Response('Error', { status: 500 });
    }
  },
};
```

### Next.js Middleware
```typescript
import logger from 'cross-log/next';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Automatically uses EdgeLogger
  logger.info(`Middleware: ${request.method} ${request.url}`, 'middleware');
  
  // Log request details
  logger.debug('Request headers', 'middleware', {
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });
  
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
```

### Next.js API Route (App Router)
```typescript
import logger from 'cross-log/next';
import { NextRequest, NextResponse } from 'next/server';

// Regular API route - uses NodeLogger
export async function GET(request: NextRequest) {
  logger.info('API route called', 'api');
  
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    logger.error(error as Error, 'api');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// Edge API route - uses EdgeLogger
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  logger.info('Edge API route called', 'api');
  
  const body = await request.json();
  logger.debug('Request body', 'api', body);
  
  return NextResponse.json({ success: true });
}
```

## Environment Variables

Edge Runtime environments access environment variables differently:

### Vercel Edge Functions
```typescript
// Variables are available on process.env in build time
// Or through the env parameter in runtime
logger.info(`Environment: ${process.env.NODE_ENV}`);
```

### Cloudflare Workers
```typescript
// Access through the env parameter
export default {
  async fetch(request: Request, env: Env) {
    logger.info(`API Key present: ${!!env.API_KEY}`);
  },
};
```

Cross-log automatically detects and uses the appropriate method.

## Configuration

### Edge-Safe Configuration
```typescript
import { createEdgeLogger, LogLevel } from 'cross-log/edge';

const logger = createEdgeLogger({
  minLevel: LogLevel.INFO,
  showTimestamp: true,
  includeStackTrace: false, // Reduce overhead in Edge
  colors: { enabled: false }, // No ANSI colors in Edge
});
```

### TypeScript Support
```typescript
import type { PartialLoggerConfig, ILogger } from 'cross-log/edge';

const config: PartialLoggerConfig = {
  minLevel: LogLevel.WARN,
  categories: {
    api: { enabled: true, minLevel: LogLevel.DEBUG },
    auth: { enabled: true, minLevel: LogLevel.INFO },
  },
};

const logger: ILogger = createEdgeLogger(config);
```

## Best Practices

1. **Use the correct entry point**: Always import from `/edge` for Edge Runtime environments
2. **Minimize logging in production**: Edge functions are performance-critical
3. **Use categories**: Organize logs by feature for better filtering
4. **Avoid heavy objects**: Large objects in logs can impact performance
5. **Handle errors properly**: Always log errors with proper context

## Limitations

In Edge Runtime environments:
- No file system access
- No Node.js-specific APIs
- Limited environment variable access
- No ANSI colors (uses plain text)
- Storage features disabled

## Migration Guide

### From console.log
```typescript
// Before
console.log('User logged in', userId);

// After
import logger from 'cross-log/edge';
logger.info('User logged in', 'auth', { userId });
```

### From other loggers
```typescript
// Before (winston, pino, etc.)
logger.info('API called', { method, path });

// After
import logger from 'cross-log/edge';
logger.info(`API called: ${method} ${path}`, 'api');
```