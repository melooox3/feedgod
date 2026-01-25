import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce, useDebouncedValue } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useDebounce callback', () => {
    it('debounces callback execution', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDebounce(callback, 300))

      act(() => {
        result.current('arg1')
        result.current('arg2')
        result.current('arg3')
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('arg3')
    })

    it('resets timer on each call', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useDebounce(callback, 300))

      act(() => {
        result.current()
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      act(() => {
        result.current()
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(callback).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('cleans up timeout on unmount', () => {
      const callback = vi.fn()
      const { result, unmount } = renderHook(() => useDebounce(callback, 300))

      act(() => {
        result.current()
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('uses latest callback reference', () => {
      let counter = 0
      const { result, rerender } = renderHook(
        ({ cb }) => useDebounce(cb, 300),
        { initialProps: { cb: () => { counter = 1 } } }
      )

      rerender({ cb: () => { counter = 2 } })

      act(() => {
        result.current()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(counter).toBe(2)
    })
  })

  describe('useDebouncedValue', () => {
    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebouncedValue('initial', 300))
      expect(result.current).toBe('initial')
    })

    it('updates value after delay', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: 'initial' } }
      )

      rerender({ value: 'updated' })
      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe('updated')
    })

    it('only updates to latest value after multiple rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: 'a' } }
      )

      rerender({ value: 'b' })
      rerender({ value: 'c' })
      rerender({ value: 'd' })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe('d')
    })

    it('works with different data types', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValue(value, 300),
        { initialProps: { value: { count: 0 } } }
      )

      rerender({ value: { count: 5 } })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toEqual({ count: 5 })
    })

    it('respects different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebouncedValue(value, delay),
        { initialProps: { value: 'initial', delay: 100 } }
      )

      rerender({ value: 'updated', delay: 100 })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe('updated')
    })
  })
})
