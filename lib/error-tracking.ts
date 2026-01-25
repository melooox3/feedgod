/**
 * Error Tracking Utility
 *
 * Provides centralized error tracking with rate limiting
 * and structured error logging for production monitoring.
 */

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

interface TrackedError {
  message: string
  stack?: string
  context: ErrorContext
  timestamp: string
  fingerprint: string
}

// Rate limiting: max errors per fingerprint per minute
const ERROR_RATE_LIMIT = 5
const RATE_LIMIT_WINDOW = 60000 // 1 minute

const errorCounts = new Map<string, { count: number; resetAt: number }>()

/**
 * Generate a fingerprint for error deduplication
 */
function generateFingerprint(error: Error, context: ErrorContext): string {
  const parts = [
    error.name,
    error.message.slice(0, 100),
    context.component || 'unknown',
    context.action || 'unknown',
  ]
  return parts.join('|')
}

/**
 * Check if error should be rate limited
 */
function isRateLimited(fingerprint: string): boolean {
  const now = Date.now()
  const entry = errorCounts.get(fingerprint)

  if (!entry || now > entry.resetAt) {
    errorCounts.set(fingerprint, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= ERROR_RATE_LIMIT) {
    return true
  }

  entry.count++
  return false
}

/**
 * Format error for logging
 */
function formatError(error: Error, context: ErrorContext): TrackedError {
  return {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    fingerprint: generateFingerprint(error, context),
  }
}

/**
 * Track an error with optional context
 */
export function trackError(error: Error, context: ErrorContext = {}): void {
  const fingerprint = generateFingerprint(error, context)

  if (isRateLimited(fingerprint)) {
    return
  }

  const trackedError = formatError(error, context)

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Log structured JSON for log aggregation services
    console.error(JSON.stringify({
      level: 'error',
      ...trackedError,
    }))
  } else {
    // Development: more readable format
    console.error('[Error Tracker]', trackedError.message, {
      context,
      stack: error.stack,
    })
  }
}

/**
 * Track a warning
 */
export function trackWarning(message: string, context: ErrorContext = {}): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify({
      level: 'warning',
      message,
      context,
      timestamp: new Date().toISOString(),
    }))
  } else {
    console.warn('[Warning]', message, context)
  }
}

/**
 * Initialize global error handlers
 */
export function initializeErrorTracking(): void {
  if (typeof window !== 'undefined') {
    // Browser unhandled errors
    window.addEventListener('error', (event) => {
      trackError(event.error || new Error(event.message), {
        component: 'window',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

      trackError(error, {
        component: 'window',
        action: 'unhandled_rejection',
      })
    })
  }

  // Node.js environment
  if (typeof process !== 'undefined' && process.on) {
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error
        ? reason
        : new Error(String(reason))

      trackError(error, {
        component: 'process',
        action: 'unhandled_rejection',
      })
    })

    process.on('uncaughtException', (error) => {
      trackError(error, {
        component: 'process',
        action: 'uncaught_exception',
      })
      // Don't exit in this utility - let the caller decide
    })
  }
}

/**
 * Create a scoped error tracker for a specific component
 */
export function createErrorTracker(component: string) {
  return {
    track: (error: Error, action?: string, metadata?: Record<string, unknown>) => {
      trackError(error, { component, action, metadata })
    },
    warn: (message: string, action?: string, metadata?: Record<string, unknown>) => {
      trackWarning(message, { component, action, metadata })
    },
  }
}

export default {
  trackError,
  trackWarning,
  initializeErrorTracking,
  createErrorTracker,
}
