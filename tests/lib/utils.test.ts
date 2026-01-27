import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatPrice, formatTimeAgo } from '@/lib/utils/utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('formatPrice', () => {
  it('formats price with default decimals', () => {
    expect(formatPrice(1234.5678)).toBe('1,234.57')
  })

  it('formats price with custom decimals', () => {
    expect(formatPrice(1234.5678, 4)).toBe('1,234.5678')
  })

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('0.00')
  })

  it('formats large numbers', () => {
    expect(formatPrice(1000000.99)).toBe('1,000,000.99')
  })

  it('handles very small decimals', () => {
    expect(formatPrice(0.001, 3)).toBe('0.001')
  })
})

describe('formatTimeAgo', () => {
  let now: number

  beforeEach(() => {
    now = Date.now()
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats seconds ago', () => {
    const date = new Date(now - 30 * 1000)
    expect(formatTimeAgo(date)).toBe('30s ago')
  })

  it('formats minutes ago', () => {
    const date = new Date(now - 5 * 60 * 1000)
    expect(formatTimeAgo(date)).toBe('5m ago')
  })

  it('formats hours ago', () => {
    const date = new Date(now - 3 * 60 * 60 * 1000)
    expect(formatTimeAgo(date)).toBe('3h ago')
  })

  it('formats days ago', () => {
    const date = new Date(now - 2 * 24 * 60 * 60 * 1000)
    expect(formatTimeAgo(date)).toBe('2d ago')
  })

  it('handles just now', () => {
    const date = new Date(now - 5 * 1000)
    expect(formatTimeAgo(date)).toBe('5s ago')
  })
})
