'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { FeedConfig, FeedPreview as FeedPreviewType } from '@/types/feed'
import { usePrices } from '@/lib/hooks/use-prices'

interface FeedPreviewProps {
  config: FeedConfig
}

export default function FeedPreview({ config }: FeedPreviewProps) {
  const [preview, setPreview] = useState<FeedPreviewType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get the symbol for price fetching (e.g., "BTC/USD" from config)
  const priceSymbol = config.symbol || 'BTC/USD'
  
  // Fetch real price for the configured symbol
  const { prices, loading: pricesLoading, refresh: refreshPrices } = usePrices([priceSymbol], 30000)
  
  // Get the real price
  const realPrice = prices[priceSymbol]?.price || 0
  const realChange = prices[priceSymbol]?.change24h || 0

  const generatePreview = async () => {
    setIsLoading(true)
    
    // Wait for real price if we don't have it yet
    if (realPrice === 0 && !pricesLoading) {
      refreshPrices()
    }
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Use real price as base, add small variance for each source
    const basePrice = realPrice || 50000 // Fallback if API fails
    
    const feedPreview: FeedPreviewType = {
      currentPrice: basePrice,
      lastUpdate: new Date(),
      sources: config.dataSources.reduce((acc, source) => {
        if (source.enabled) {
          // Each source has slight variance around real price (±0.5%)
          const variance = (Math.random() - 0.5) * 0.01 * basePrice
          acc[source.id] = {
            price: basePrice + variance,
            timestamp: new Date(),
            status: Math.random() > 0.1 ? 'active' : 'error',
          }
        }
        return acc
      }, {} as FeedPreviewType['sources']),
      aggregatedPrice: basePrice,
    }

    // Calculate aggregated price based on aggregator type
    const prices = Object.values(feedPreview.sources)
      .filter(s => s.status === 'active')
      .map(s => s.price)

    if (prices.length > 0) {
      if (config.aggregator.type === 'median') {
        prices.sort((a, b) => a - b)
        feedPreview.aggregatedPrice = prices[Math.floor(prices.length / 2)]
      } else if (config.aggregator.type === 'mean') {
        feedPreview.aggregatedPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      } else if (config.aggregator.type === 'weighted') {
        const weights = config.dataSources
          .filter(s => s.enabled && feedPreview.sources[s.id]?.status === 'active')
          .map(s => s.weight || 1)
        const totalWeight = weights.reduce((a, b) => a + b, 0)
        feedPreview.aggregatedPrice = prices.reduce((sum, price, i) => 
          sum + price * (weights[i] / totalWeight), 0
        )
      }
    }

    setPreview(feedPreview)
    setIsLoading(false)
  }

  // Update preview when real price changes
  useEffect(() => {
    if (config.dataSources.length > 0 && realPrice > 0) {
      generatePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.dataSources.length, config.aggregator.type, realPrice])

  // Initial load
  useEffect(() => {
    if (config.dataSources.length > 0) {
      generatePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!preview && !isLoading && !pricesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Add data sources to see preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Preview</h3>
          <p className="text-sm text-gray-400 mt-1">
            Real-time price from CoinGecko
          </p>
        </div>
        <button
          onClick={() => { refreshPrices(); generatePreview(); }}
          disabled={isLoading || pricesLoading}
          className="px-4 py-2 bg-feedgod-primary dark:text-feedgod-primary hover:bg-feedgod-primary dark:text-feedgod-primary/80 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || pricesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading || pricesLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-feedgod-primary dark:text-feedgod-primary mx-auto mb-4" />
          <p className="text-gray-400">Fetching real-time prices...</p>
        </div>
      ) : preview ? (
        <>
          {/* Aggregated Price */}
          <div className="bg-gradient-to-br from-feedgod-primary dark:text-feedgod-primary/20 to-feedgod-secondary/20 rounded-lg p-6 border border-feedgod-primary dark:text-feedgod-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Aggregated Price</p>
                <p className="text-3xl font-bold text-white">
                  ${preview.aggregatedPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-gray-400">
                    {config.symbol} • {config.aggregator.type} aggregation
                  </p>
                  {realChange !== 0 && (
                    <span className={`text-xs font-medium ${realChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {realChange >= 0 ? '+' : ''}{realChange.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Live</span>
                </div>
                <p className="text-xs text-gray-400">
                  Updated {preview.lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Source Prices */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Source Prices</h4>
            <div className="space-y-2">
              {Object.entries(preview.sources).map(([sourceId, source]) => {
                const sourceConfig = config.dataSources.find(s => s.id === sourceId)
                if (!sourceConfig) return null

                return (
                  <div
                    key={sourceId}
                    className="bg-feedgod-dark-accent rounded-lg p-4 border border-feedgod-dark-accent"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {source.status === 'active' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{sourceConfig.name}</p>
                          <p className="text-xs text-gray-400">
                            ${source.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${
                          source.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {source.status}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Weight: {sourceConfig.weight || 1}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Feed Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-feedgod-dark-accent rounded-lg p-4 border border-feedgod-dark-accent">
              <p className="text-xs text-gray-400 mb-1">Update Interval</p>
              <p className="text-lg font-semibold text-white">{config.updateInterval}s</p>
            </div>
            <div className="bg-feedgod-dark-accent rounded-lg p-4 border border-feedgod-dark-accent">
              <p className="text-xs text-gray-400 mb-1">Active Sources</p>
              <p className="text-lg font-semibold text-white">
                {Object.values(preview.sources).filter(s => s.status === 'active').length} / {config.dataSources.length}
              </p>
            </div>
            <div className="bg-feedgod-dark-accent rounded-lg p-4 border border-feedgod-dark-accent">
              <p className="text-xs text-gray-400 mb-1">Network</p>
              <p className="text-lg font-semibold text-white capitalize">{config.network}</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
