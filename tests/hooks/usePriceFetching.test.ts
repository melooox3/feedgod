import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePriceFetching, PRICE_REFRESH_INTERVAL } from '@/hooks/usePriceFetching'
import type { FeedConfig } from '@/types/feed'

// Mock price-api module
vi.mock('@/lib/price-api', () => ({
  fetchSurgePrice: vi.fn().mockResolvedValue({
    price: 95000,
    volume24h: 50000000000,
    priceChange24h: 2.5,
    lastUpdate: new Date(),
  }),
  fetchSourcePrice: vi.fn().mockResolvedValue({
    price: 95000,
    status: 'active',
    timestamp: new Date(),
  }),
  generateChartData: vi.fn(() => [{ time: Date.now(), price: 95000 }]),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    price: {
      error: vi.fn(),
    },
  },
}))

import { fetchSurgePrice, fetchSourcePrice } from '@/lib/price-api'

describe('usePriceFetching', () => {
  const mockConfig: FeedConfig = {
    name: 'BTC/USD Feed',
    symbol: 'BTC/USD',
    dataSources: [
      { id: 'surge', name: 'Surge', type: 'api', enabled: true, weight: 1 },
      { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
    ],
    aggregator: { type: 'median' },
    updateInterval: 60,
    decimals: 8,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() => usePriceFetching({ config: mockConfig }))

    expect(result.current.isLoadingPrices).toBe(true)
  })

  it('returns expected shape', () => {
    const { result } = renderHook(() => usePriceFetching({ config: mockConfig }))

    expect(result.current).toHaveProperty('currentPrice')
    expect(result.current).toHaveProperty('priceChange')
    expect(result.current).toHaveProperty('priceData')
    expect(result.current).toHaveProperty('sourcePrices')
    expect(result.current).toHaveProperty('isLoadingPrices')
    expect(result.current).toHaveProperty('refreshPrices')
    expect(typeof result.current.refreshPrices).toBe('function')
  })

  it('returns null price when config is null', () => {
    const { result } = renderHook(() => usePriceFetching({ config: null }))

    expect(result.current.currentPrice).toBeNull()
  })

  it('has correct initial source prices state', () => {
    const { result } = renderHook(() => usePriceFetching({ config: mockConfig }))

    expect(result.current.sourcePrices).toEqual({})
  })

  it('exports PRICE_REFRESH_INTERVAL constant', () => {
    expect(PRICE_REFRESH_INTERVAL).toBe(30000)
  })
})
