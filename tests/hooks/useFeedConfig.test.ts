import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedConfig, AVAILABLE_SOURCES, DEFAULT_CONFIG } from '@/hooks/useFeedConfig'
import type { FeedConfig, DataSource } from '@/types/feed'

// Mock sound utility
vi.mock('@/lib/sound-utils', () => ({
  playPickupSound: vi.fn(),
}))

describe('useFeedConfig', () => {
  const mockOnConfigChange = vi.fn()

  const mockConfig: FeedConfig = {
    id: 'test-feed-1',
    name: 'Test Feed',
    symbol: 'ETH/USD',
    dataSources: [
      { id: 'surge', name: 'Surge', type: 'api', enabled: true, weight: 1 },
      { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
    ],
    aggregator: { type: 'median' },
    updateInterval: 30,
    decimals: 8,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnConfigChange.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with provided config', () => {
    const { result } = renderHook(() =>
      useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
    )

    expect(result.current.localConfig).toBeDefined()
    expect(result.current.localConfig?.symbol).toBe('ETH/USD')
  })

  it('creates default config when none provided', () => {
    const { result } = renderHook(() =>
      useFeedConfig({ config: null, onConfigChange: mockOnConfigChange })
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.localConfig).toEqual(DEFAULT_CONFIG)
  })

  it('returns available sources', () => {
    const { result } = renderHook(() =>
      useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
    )

    expect(result.current.availableSources).toEqual(AVAILABLE_SOURCES)
  })

  it('returns enabled sources correctly', () => {
    const configWithMixedSources: FeedConfig = {
      ...mockConfig,
      dataSources: [
        { id: 'surge', name: 'Surge', type: 'api', enabled: true, weight: 1 },
        { id: 'binance', name: 'Binance', type: 'api', enabled: false, weight: 1 },
      ],
    }

    const { result } = renderHook(() =>
      useFeedConfig({ config: configWithMixedSources, onConfigChange: mockOnConfigChange })
    )

    expect(result.current.enabledSources.length).toBe(1)
    expect(result.current.enabledSources[0].id).toBe('surge')
  })

  it('returns sources available to add', () => {
    const { result } = renderHook(() =>
      useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
    )

    const availableToAdd = result.current.availableToAdd
    expect(availableToAdd.some(s => s.id === 'surge')).toBe(false)
    expect(availableToAdd.some(s => s.id === 'coinbase')).toBe(true)
  })

  describe('handleConfigUpdate', () => {
    it('updates local config', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      act(() => {
        result.current.handleConfigUpdate({ updateInterval: 120 })
      })

      expect(result.current.localConfig?.updateInterval).toBe(120)
    })

    it('calls onConfigChange with debounce', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      act(() => {
        result.current.handleConfigUpdate({ updateInterval: 120 })
      })

      expect(mockOnConfigChange).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(mockOnConfigChange).toHaveBeenCalled()
    })

    it('preserves blockchain setting on update', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      act(() => {
        result.current.handleConfigUpdate({ blockchain: 'ethereum' })
        vi.advanceTimersByTime(200)
      })

      expect(result.current.localConfig?.blockchain).toBe('ethereum')
    })
  })

  describe('toggleSource', () => {
    it('toggles source enabled state', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      const initialState = result.current.localConfig?.dataSources.find(s => s.id === 'surge')?.enabled

      act(() => {
        result.current.toggleSource('surge')
      })

      const newState = result.current.localConfig?.dataSources.find(s => s.id === 'surge')?.enabled

      expect(newState).toBe(!initialState)
    })
  })

  describe('addSource', () => {
    it('adds new source to config', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      const newSource: DataSource = {
        id: 'kraken',
        name: 'Kraken',
        type: 'api',
        enabled: true,
        weight: 1,
      }

      const initialCount = result.current.localConfig?.dataSources.length || 0

      act(() => {
        result.current.addSource(newSource)
      })

      expect(result.current.localConfig?.dataSources.length).toBe(initialCount + 1)
      expect(result.current.localConfig?.dataSources.some(s => s.id === 'kraken')).toBe(true)
    })

    it('does not add duplicate source', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      const existingSource: DataSource = {
        id: 'surge',
        name: 'Surge',
        type: 'api',
        enabled: true,
        weight: 1,
      }

      const initialCount = result.current.localConfig?.dataSources.length || 0

      act(() => {
        result.current.addSource(existingSource)
      })

      expect(result.current.localConfig?.dataSources.length).toBe(initialCount)
    })
  })

  describe('removeSource', () => {
    it('removes source from config', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      act(() => {
        result.current.removeSource('surge')
      })

      expect(result.current.localConfig?.dataSources.some(s => s.id === 'surge')).toBe(false)
    })
  })

  describe('updateSourceWeight', () => {
    it('updates source weight', () => {
      const { result } = renderHook(() =>
        useFeedConfig({ config: mockConfig, onConfigChange: mockOnConfigChange })
      )

      act(() => {
        result.current.updateSourceWeight('surge', 2)
      })

      const source = result.current.localConfig?.dataSources.find(s => s.id === 'surge')
      expect(source?.weight).toBe(2)
    })
  })
})
