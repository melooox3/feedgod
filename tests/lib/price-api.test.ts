import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchSurgePrice,
  fetchBinancePrice,
  fetchCoinbasePrice,
  fetchKrakenPrice,
  fetchSourcePrice,
  generateChartData
} from '@/lib/api/price-api'

describe('price-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchSurgePrice', () => {
    it('returns price data for supported symbol via Crossbar', async () => {
      // Mock Crossbar API response (array with results)
      const mockCrossbarResponse = [
        { results: ['95000.00'] }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCrossbarResponse),
      } as Response)

      const result = await fetchSurgePrice('BTC/USD')

      expect(result).toBeDefined()
      expect(result?.price).toBe(95000)
      expect(result?.timestamp).toBeInstanceOf(Date)
    })

    it('returns null for unsupported symbol', async () => {
      // Unsupported symbols return null before making any API call
      const result = await fetchSurgePrice('INVALID/USD')
      expect(result).toBeNull()
    })

    it('returns error status on API failure', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response)

      const result = await fetchSurgePrice('BTC/USD')
      // Returns error object when API fails but symbol is supported
      expect(result?.status).toBe('error')
      expect(result?.price).toBe(0)
    })

    it('returns error status on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const result = await fetchSurgePrice('BTC/USD')
      expect(result?.status).toBe('error')
      expect(result?.price).toBe(0)
    })
  })

  describe('fetchBinancePrice', () => {
    it('returns price data for valid symbol', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ lastPrice: '95000.50' }),
      } as Response)

      const result = await fetchBinancePrice('BTC/USD')

      expect(result).toBeDefined()
      expect(result?.price).toBe(95000.50)
      expect(result?.status).toBe('active')
    })

    it('returns error status on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ msg: 'Invalid symbol' }),
      } as Response)

      const result = await fetchBinancePrice('INVALID/USD')
      expect(result?.status).toBe('error')
      expect(result?.price).toBe(0)
    })

    it('returns error status on invalid price', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ lastPrice: 'invalid' }),
      } as Response)

      const result = await fetchBinancePrice('BTC/USD')
      expect(result?.status).toBe('error')
    })
  })

  describe('fetchCoinbasePrice', () => {
    it('returns price data for valid symbol', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { rates: { USD: '95000' } } }),
      } as Response)

      const result = await fetchCoinbasePrice('BTC/USD')

      expect(result).toBeDefined()
      expect(result?.price).toBe(95000)
      expect(result?.status).toBe('active')
    })

    it('returns error status on missing rates', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response)

      const result = await fetchCoinbasePrice('BTC/USD')
      expect(result?.status).toBe('error')
    })
  })

  describe('fetchKrakenPrice', () => {
    it('returns price data for valid symbol', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: { 'XXBTZUSD': { c: ['95000.0'] } }
        }),
      } as Response)

      const result = await fetchKrakenPrice('BTC/USD')

      expect(result).toBeDefined()
      expect(result?.price).toBe(95000)
      expect(result?.status).toBe('active')
    })
  })

  describe('fetchSourcePrice', () => {
    it('returns price from surge source', async () => {
      // Mock Crossbar API response format (array with results)
      const mockCrossbarResponse = [
        { results: ['95000.00'] }
      ]

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCrossbarResponse),
      } as Response)

      const result = await fetchSourcePrice('surge', 'BTC/USD')
      expect(result?.price).toBe(95000)
    })

    it('returns null for unknown source', async () => {
      const result = await fetchSourcePrice('unknown', 'BTC/USD')
      expect(result).toBeNull()
    })
  })

  describe('generateChartData', () => {
    it('generates correct number of data points', () => {
      const data = generateChartData(95000, 24)
      expect(data.length).toBe(25) // 24 hours + current
    })

    it('generates data points with time and price', () => {
      const data = generateChartData(95000, 24)

      data.forEach(point => {
        expect(point.time).toBeDefined()
        expect(typeof point.time).toBe('number')
        expect(point.price).toBeDefined()
        expect(typeof point.price).toBe('number')
        expect(point.price).toBeGreaterThan(0)
      })
    })

    it('generates prices within reasonable range', () => {
      const basePrice = 95000
      const data = generateChartData(basePrice, 24)

      data.forEach(point => {
        // Prices should be within 10% of base
        expect(point.price).toBeGreaterThan(basePrice * 0.85)
        expect(point.price).toBeLessThan(basePrice * 1.15)
      })
    })
  })
})
