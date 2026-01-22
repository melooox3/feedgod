'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedConfig } from '@/types/feed'
import { fetchCoinGeckoPrice, fetchSourcePrice, generateChartData } from '@/lib/price-api'
import { logger } from '@/lib/logger'

/** Interval for auto-refreshing prices (30 seconds for CoinGecko free tier) */
const PRICE_REFRESH_INTERVAL = 30000

interface SourcePrice {
  price: number
  status: 'active' | 'error'
}

interface ChartDataPoint {
  time: number
  price: number
}

interface UsePriceFetchingProps {
  config: FeedConfig | null
}

interface UsePriceFetchingReturn {
  currentPrice: number | null
  priceChange: number | null
  priceData: ChartDataPoint[]
  sourcePrices: Record<string, SourcePrice>
  isLoadingPrices: boolean
  refreshPrices: () => Promise<void>
}

/**
 * Custom hook for fetching and managing price data from multiple sources
 * Handles automatic refresh, chart data generation, and price aggregation
 */
export function usePriceFetching({
  config,
}: UsePriceFetchingProps): UsePriceFetchingReturn {
  const [priceData, setPriceData] = useState<ChartDataPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [sourcePrices, setSourcePrices] = useState<Record<string, SourcePrice>>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [lastSymbol, setLastSymbol] = useState<string>('')

  /**
   * Fetch prices from all enabled sources and calculate aggregated price
   */
  const fetchPrices = useCallback(async (updateChart = false) => {
    if (!config) return

    setIsLoadingPrices(true)
    try {
      // Fetch main price data from CoinGecko (includes volume and change)
      const mainPriceData = await fetchCoinGeckoPrice(config.symbol)

      if (mainPriceData) {
        setCurrentPrice(mainPriceData.price)
        setPriceChange(mainPriceData.priceChange24h)

        if (updateChart) {
          const chartData = generateChartData(mainPriceData.price, 24)
          setPriceData(chartData)
        }
      }

      // Fetch prices from all enabled sources
      const enabledSources = config.dataSources.filter(s => s.enabled)
      const sourcePricePromises = enabledSources.map(async (source) => {
        try {
          const priceData = await fetchSourcePrice(source.id, config.symbol)
          return { sourceId: source.id, priceData }
        } catch (error) {
          logger.price.error(`Error fetching ${source.name}:`, error)
          return {
            sourceId: source.id,
            priceData: { price: 0, status: 'error' as const, timestamp: new Date() },
          }
        }
      })

      const sourceResults = await Promise.all(sourcePricePromises)
      const prices: Record<string, SourcePrice> = {}

      sourceResults.forEach(({ sourceId, priceData }) => {
        if (priceData) {
          prices[sourceId] = {
            price: priceData.price,
            status: priceData.status,
          }
        }
      })

      setSourcePrices(prices)

      // Calculate aggregated price from real source prices
      const activePrices = Object.values(prices)
        .filter(p => p.status === 'active' && p.price > 0)
        .map(p => p.price)

      if (activePrices.length > 0) {
        const aggregated = calculateAggregatedPrice(
          activePrices,
          config.aggregator.type,
          config.dataSources,
          prices
        )
        setCurrentPrice(aggregated)
      }
    } catch (error) {
      logger.price.error('Error fetching prices:', error)
    } finally {
      setIsLoadingPrices(false)
    }
  }, [config])

  /**
   * Manual refresh that also updates the chart
   */
  const refreshPrices = useCallback(async () => {
    if (!config) return

    setIsLoadingPrices(true)
    try {
      const mainPriceData = await fetchCoinGeckoPrice(config.symbol)
      if (mainPriceData) {
        setCurrentPrice(mainPriceData.price)
        setPriceChange(mainPriceData.priceChange24h)
        const chartData = generateChartData(mainPriceData.price, 24)
        setPriceData(chartData)
      }

      // Refresh source prices
      const enabledSources = config.dataSources.filter(s => s.enabled)
      const sourcePricePromises = enabledSources.map(async (source) => {
        try {
          const priceData = await fetchSourcePrice(source.id, config.symbol)
          return { sourceId: source.id, priceData }
        } catch (error) {
          return {
            sourceId: source.id,
            priceData: { price: 0, status: 'error' as const, timestamp: new Date() },
          }
        }
      })

      const sourceResults = await Promise.all(sourcePricePromises)
      const prices: Record<string, SourcePrice> = {}
      sourceResults.forEach(({ sourceId, priceData }) => {
        if (priceData) {
          prices[sourceId] = {
            price: priceData.price,
            status: priceData.status,
          }
        }
      })
      setSourcePrices(prices)
    } catch (error) {
      logger.price.error('Error refreshing prices:', error)
    } finally {
      setIsLoadingPrices(false)
    }
  }, [config])

  // Generate chart data when symbol changes
  useEffect(() => {
    if (!config) return

    if (config.symbol !== lastSymbol && currentPrice) {
      const chartData = generateChartData(currentPrice, 24)
      setPriceData(chartData)
      setLastSymbol(config.symbol)
    } else if (priceData.length === 0 && currentPrice) {
      const chartData = generateChartData(currentPrice, 24)
      setPriceData(chartData)
      setLastSymbol(config.symbol)
    }
  }, [config?.symbol, currentPrice, lastSymbol, priceData.length, config])

  // Auto-fetch prices on config change and set up interval
  useEffect(() => {
    if (!config) return

    fetchPrices(false)

    const interval = setInterval(() => fetchPrices(false), PRICE_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [config, fetchPrices])

  return {
    currentPrice,
    priceChange,
    priceData,
    sourcePrices,
    isLoadingPrices,
    refreshPrices,
  }
}

/**
 * Calculate aggregated price based on aggregation method
 */
function calculateAggregatedPrice(
  activePrices: number[],
  aggregationType: string,
  dataSources: { id: string; enabled: boolean; weight?: number }[],
  sourcePrices: Record<string, SourcePrice>
): number {
  if (activePrices.length === 0) return 0

  switch (aggregationType) {
    case 'median': {
      const sorted = [...activePrices].sort((a, b) => a - b)
      return sorted[Math.floor(sorted.length / 2)]
    }
    case 'mean': {
      return activePrices.reduce((a, b) => a + b, 0) / activePrices.length
    }
    case 'weighted': {
      const weights = dataSources
        .filter(s => s.enabled && sourcePrices[s.id]?.status === 'active')
        .map(s => s.weight || 1)
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      return activePrices.reduce((sum, price, i) =>
        sum + price * (weights[i] / totalWeight), 0
      )
    }
    default:
      return activePrices[0]
  }
}

export { PRICE_REFRESH_INTERVAL }
