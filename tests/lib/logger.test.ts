import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLogger, logger } from '@/lib/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createLogger', () => {
    it('creates logger with namespace', () => {
      const testLogger = createLogger('TestModule')

      expect(testLogger).toBeDefined()
      expect(testLogger.debug).toBeDefined()
      expect(testLogger.info).toBeDefined()
      expect(testLogger.warn).toBeDefined()
      expect(testLogger.error).toBeDefined()
    })

    it('logs with correct prefix', () => {
      const testLogger = createLogger('TestModule', { enabled: true, level: 'debug' })

      testLogger.debug('test message')

      expect(console.log).toHaveBeenCalledWith('[Feedgod][TestModule]', 'test message')
    })

    it('respects log level hierarchy', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'warn' })

      testLogger.debug('debug')
      testLogger.info('info')
      testLogger.warn('warn')
      testLogger.error('error')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it('can be disabled', () => {
      const testLogger = createLogger('Test', { enabled: false })

      testLogger.error('should not log')

      expect(console.error).not.toHaveBeenCalled()
    })

    it('logs multiple arguments', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'debug' })

      testLogger.info('message', { data: 123 }, 'extra')

      expect(console.info).toHaveBeenCalledWith('[Feedgod][Test]', 'message', { data: 123 }, 'extra')
    })
  })

  describe('pre-configured loggers', () => {
    it('has switchboard logger', () => {
      expect(logger.switchboard).toBeDefined()
    })

    it('has deployment logger', () => {
      expect(logger.deployment).toBeDefined()
    })

    it('has price logger', () => {
      expect(logger.price).toBeDefined()
    })

    it('has config logger', () => {
      expect(logger.config).toBeDefined()
    })

    it('has api logger', () => {
      expect(logger.api).toBeDefined()
    })

    it('has router logger', () => {
      expect(logger.router).toBeDefined()
    })
  })

  describe('log levels', () => {
    it('debug is lowest priority', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'debug' })

      testLogger.debug('debug message')

      expect(console.log).toHaveBeenCalled()
    })

    it('info is higher than debug', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'info' })

      testLogger.debug('debug')
      testLogger.info('info')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
    })

    it('warn is higher than info', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'warn' })

      testLogger.info('info')
      testLogger.warn('warn')

      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    })

    it('error is highest priority', () => {
      const testLogger = createLogger('Test', { enabled: true, level: 'error' })

      testLogger.warn('warn')
      testLogger.error('error')

      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })
  })
})
