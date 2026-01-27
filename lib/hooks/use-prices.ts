'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCoinGeckoId as getCoinGeckoIdFromLib } from '@/lib/constants/coin-ids'

export interface PriceInfo {
  price: number
  change24h: number
  lastUpdated: string
}

interface PricesState {
  prices: Record<string, PriceInfo>
  loading: boolean
  error: string | null
  lastFetch: Date | null
}

// Global price cache to share across components
let globalPriceCache: Record<string, PriceInfo> = {}
let lastGlobalFetch: number = 0
const CACHE_DURATION = 30000 // 30 seconds

/**
 * Hook to fetch real-time prices for given symbols
 * @param symbols Array of symbols like ['BTC/USD', 'ETH/USD', 'SOL/USD']
 * @param refreshInterval Refresh interval in ms (default: 30000)
 */
export function usePrices(symbols: string[], refreshInterval: number = 30000) {
  // Initialize with cached prices immediately for instant display
  const [state, setState] = useState<PricesState>(() => {
    // Check if we have cached prices
    const cachedPrices: Record<string, PriceInfo> = {}
    let hasCached = false
    
    for (const symbol of symbols) {
      if (globalPriceCache[symbol]) {
        cachedPrices[symbol] = globalPriceCache[symbol]
        hasCached = true
      }
    }
    
    return {
      prices: cachedPrices,
      loading: !hasCached, // Only show loading if no cached data
      error: null,
      lastFetch: hasCached ? new Date(lastGlobalFetch) : null,
    }
  })
  
  const isMounted = useRef(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPrices = useCallback(async (force: boolean = false) => {
    if (symbols.length === 0) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    // Check cache first (unless forced)
    const now = Date.now()
    if (!force && lastGlobalFetch && now - lastGlobalFetch < CACHE_DURATION) {
      const cachedPrices: Record<string, PriceInfo> = {}
      let allCached = true
      
      for (const symbol of symbols) {
        if (globalPriceCache[symbol]) {
          cachedPrices[symbol] = globalPriceCache[symbol]
        } else {
          allCached = false
          break
        }
      }
      
      if (allCached) {
        setState(prev => ({
          ...prev,
          prices: cachedPrices,
          loading: false,
          lastFetch: new Date(lastGlobalFetch),
        }))
        return
      }
    }

    try {
      setState(prev => ({ ...prev, loading: prev.lastFetch === null }))
      
      const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error && !data.prices) {
        throw new Error(data.error)
      }
      
      // Update global cache
      const newPrices: Record<string, PriceInfo> = {}
      
      for (const symbol of symbols) {
        if (data.prices?.[symbol]) {
          const priceData = data.prices[symbol]
          newPrices[symbol] = {
            price: priceData.price,
            change24h: priceData.change24h,
            lastUpdated: priceData.lastUpdated,
          }
          globalPriceCache[symbol] = newPrices[symbol]
        }
      }
      
      lastGlobalFetch = Date.now()
      
      if (isMounted.current) {
        setState({
          prices: newPrices,
          loading: false,
          error: null,
          lastFetch: new Date(),
        })
      }
      
    } catch (error) {
      console.error('Failed to fetch prices:', error)
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch prices',
        }))
      }
    }
  }, [symbols])

  // Initial fetch
  useEffect(() => {
    isMounted.current = true
    fetchPrices()
    
    return () => {
      isMounted.current = false
    }
  }, [fetchPrices])

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return
    
    fetchTimeoutRef.current = setInterval(() => {
      fetchPrices(true)
    }, refreshInterval)
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearInterval(fetchTimeoutRef.current)
      }
    }
  }, [refreshInterval, fetchPrices])

  const refresh = useCallback(() => {
    fetchPrices(true)
  }, [fetchPrices])

  return {
    ...state,
    refresh,
    getPrice: (symbol: string) => state.prices[symbol]?.price ?? null,
    getChange: (symbol: string) => state.prices[symbol]?.change24h ?? null,
  }
}

/**
 * Fetch prices once (not a hook, for use in server components or outside React)
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceInfo>> {
  if (symbols.length === 0) return {}
  
  try {
    const response = await fetch(`/api/prices?symbols=${symbols.join(',')}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: ${response.status}`)
    }
    
    const data = await response.json()
    
    const prices: Record<string, PriceInfo> = {}
    
    for (const symbol of symbols) {
      if (data.prices?.[symbol]) {
        prices[symbol] = {
          price: data.prices[symbol].price,
          change24h: data.prices[symbol].change24h,
          lastUpdated: data.prices[symbol].lastUpdated,
        }
      }
    }
    
    return prices
    
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return {}
  }
}

/**
 * Get CoinGecko ID for a symbol
 * Re-exported from coin-ids for backward compatibility
 */
export const getCoinGeckoId = getCoinGeckoIdFromLib

/**
 * Clear the global price cache
 */
export function clearPriceCache() {
  globalPriceCache = {}
  lastGlobalFetch = 0
}
