/**
 * Centralized logging utility
 *
 * In production, logs are disabled by default.
 * Enable verbose logging by setting NEXT_PUBLIC_DEBUG=true
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isProduction = process.env.NODE_ENV === 'production'
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'

const defaultConfig: LoggerConfig = {
  enabled: !isProduction || isDebugEnabled,
  level: isProduction ? 'warn' : 'debug',
  prefix: '[Feedgod]',
}

/**
 * Create a namespaced logger instance
 */
export function createLogger(namespace: string, config: Partial<LoggerConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config }
  const prefix = `${mergedConfig.prefix}[${namespace}]`

  const shouldLog = (level: LogLevel): boolean => {
    if (!mergedConfig.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[mergedConfig.level]
  }

  return {
    debug: (...args: unknown[]) => {
      if (shouldLog('debug')) {
        console.log(prefix, ...args)
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog('info')) {
        console.info(prefix, ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog('warn')) {
        console.warn(prefix, ...args)
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog('error')) {
        console.error(prefix, ...args)
      }
    },
  }
}

// Pre-configured loggers for common modules
export const logger = {
  switchboard: createLogger('Switchboard'),
  deployment: createLogger('Deployment'),
  price: createLogger('Price'),
  config: createLogger('Config'),
  api: createLogger('API'),
  router: createLogger('Router'),
}

export default logger
