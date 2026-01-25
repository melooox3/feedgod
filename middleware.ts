import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for request/response logging and performance monitoring
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  // Create response with performance headers
  const response = NextResponse.next()

  // Add request ID for tracing
  response.headers.set('X-Request-Id', requestId)

  // Add timing header
  const duration = Date.now() - startTime
  response.headers.set('X-Response-Time', `${duration}ms`)

  // Log request in production (structured JSON)
  if (process.env.NODE_ENV === 'production') {
    const logEntry = {
      level: 'info',
      type: 'request',
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.slice(0, 100),
    }

    // Only log API routes and page requests, not static assets
    if (!request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2)$/)) {
      console.log(JSON.stringify(logEntry))
    }
  }

  return response
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
