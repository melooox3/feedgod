'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { FeedConfig, FeedPreview as FeedPreviewType } from '@/types/feed'

interface FeedPreviewProps {
  config: FeedConfig
}

export default function FeedPreview({ config }: FeedPreviewProps) {
  const [preview, setPreview] = useState<FeedPreviewType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generatePreview = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const mockPreview: FeedPreviewType = {
      currentPrice: 43250.50,
      lastUpdate: new Date(),
      sources: config.dataSources.reduce((acc, source) => {
        if (source.enabled) {
          acc[source.id] = {
            price: 43250.50 + (Math.random() - 0.5) * 100,
            timestamp: new Date(),
            status: Math.random() > 0.1 ? 'active' : 'error',
          }
        }
        return acc
      }, {} as FeedPreviewType['sources']),
      aggregatedPrice: 43250.50,
    }

    // Calculate aggregated price based on aggregator type
    const prices = Object.values(mockPreview.sources)
      .filter(s => s.status === 'active')
      .map(s => s.price)

    if (prices.length > 0) {
      if (config.aggregator.type === 'median') {
        prices.sort((a, b) => a - b)
        mockPreview.aggregatedPrice = prices[Math.floor(prices.length / 2)]
      } else if (config.aggregator.type === 'mean') {
        mockPreview.aggregatedPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      } else if (config.aggregator.type === 'weighted') {
        const weights = config.dataSources
          .filter(s => s.enabled && mockPreview.sources[s.id]?.status === 'active')
          .map(s => s.weight || 1)
        const totalWeight = weights.reduce((a, b) => a + b, 0)
        mockPreview.aggregatedPrice = prices.reduce((sum, price, i) => 
          sum + price * (weights[i] / totalWeight), 0
        )
      }
    }

    setPreview(mockPreview)
    setIsLoading(false)
  }

  useEffect(() => {
    if (config.dataSources.length > 0) {
      generatePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.dataSources.length, config.aggregator.type])

  if (!preview && !isLoading) {
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
            Real-time feed simulation
          </p>
        </div>
        <button
          onClick={generatePreview}
          disabled={isLoading}
          className="px-4 py-2 bg-feedgod-primary dark:text-feedgod-primary hover:bg-feedgod-primary dark:text-feedgod-primary/80 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-feedgod-primary dark:text-feedgod-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading preview...</p>
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
                <p className="text-xs text-gray-400 mt-2">
                  {config.symbol} • {config.aggregator.type} aggregation
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Active</span>
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

