'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Save, CheckCircle2, XCircle, TrendingUp, TrendingDown, Settings, Clock, Network, Hash, RefreshCw, Plus, DollarSign } from 'lucide-react'
import { FeedConfig, DataSource, Blockchain } from '@/types/feed'
import { fetchCoinGeckoPrice, fetchSourcePrice, generateChartData } from '@/lib/price-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'
import CustomSourceModal from './CustomSourceModal'

interface FeedBuilderProps {
  config: FeedConfig | null
  onConfigChange: (config: FeedConfig) => void
}

const AVAILABLE_SOURCES: DataSource[] = [
  { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
  { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
  { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
  { id: 'kraken', name: 'Kraken', type: 'api', enabled: true, weight: 1 },
  { id: 'pyth', name: 'Pyth Network', type: 'on-chain', enabled: true, weight: 1 },
  { id: 'chainlink', name: 'Chainlink', type: 'on-chain', enabled: true, weight: 1 },
]

// Format price with appropriate decimal places
// For prices < 1, show 5 decimal places, otherwise show 2
function formatPrice(price: number): string {
  if (price < 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })
  } else {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
}

// Cost Estimate Component
function CostEstimateDisplay({ 
  blockchain, 
  network, 
  operationType 
}: { 
  blockchain: string
  network: string
  operationType: 'feed' | 'function' | 'vrf' | 'secret'
}) {
  const { estimate, isLoading } = useCostEstimate(
    blockchain as any,
    network as any,
    operationType
  )

  if (isLoading || !estimate) {
    return (
      <div className="px-3 py-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
        <div className="flex items-center gap-2 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-3.5 h-3.5 animate-pulse" />
          <span>Calculating deployment cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-3.5 h-3.5" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
            {estimate.estimatedCost} {estimate.currency}
          </div>
          {estimate.usdEstimate && (
            <div className="text-[10px] text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              {estimate.usdEstimate}
            </div>
          )}
        </div>
      </div>
      {estimate.gasPrice && (
        <div className="mt-1.5 text-[10px] text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          Gas: {estimate.gasPrice} gwei
        </div>
      )}
    </div>
  )
}

export default function FeedBuilder({ config, onConfigChange }: FeedBuilderProps) {
  const [localConfig, setLocalConfig] = useState<FeedConfig | null>(config)
  const [priceData, setPriceData] = useState<Array<{ time: number; price: number }>>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [sourcePrices, setSourcePrices] = useState<Record<string, { price: number; status: 'active' | 'error' }>>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [lastSymbol, setLastSymbol] = useState<string>('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const isLocalUpdateRef = useRef(false)
  const lastBlockchainChangeRef = useRef<{ blockchain: string; network: string } | null>(null)
  const lastConfigIdRef = useRef<string | undefined>(undefined)
  const currentBlockchainRef = useRef<Blockchain | undefined>(localConfig?.blockchain)

  // Update local config when prop changes - but only on initial load or when switching feeds
  useEffect(() => {
    console.log('useEffect triggered:', {
      configId: config?.id,
      localConfigId: localConfig?.id,
      isLocalUpdate: isLocalUpdateRef.current,
      configBlockchain: config?.blockchain,
      localConfigBlockchain: localConfig?.blockchain,
    })
    
    // Don't overwrite if we just made a local update
    if (isLocalUpdateRef.current) {
      console.log('Skipping update - local update in progress')
      isLocalUpdateRef.current = false
      // Clear blockchain ref after a delay
      setTimeout(() => {
        lastBlockchainChangeRef.current = null
      }, 2000) // Increased delay to ensure parent update completes
      return
    }

    // Check if this is actually a different feed by comparing IDs and key fields
    const currentConfigId = config?.id
    const isDifferentFeedById = lastConfigIdRef.current !== currentConfigId
    
    // Also check if it's a different feed by comparing key fields (for prompts without IDs)
    const isDifferentFeedByContent = config && localConfig && (
      config.symbol !== localConfig.symbol ||
      config.name !== localConfig.name ||
      config.updateInterval !== localConfig.updateInterval
    )
    
    const isDifferentFeed = isDifferentFeedById || isDifferentFeedByContent

    // CRITICAL: If we have localConfig and the feed hasn't changed (by ID or content), NEVER update blockchain/network
    // This ensures user selections are preserved even when parent passes back stale data
    if (localConfig && !isDifferentFeed) {
      // Same feed - do NOTHING, preserve all local state including blockchain/network
      // Even if parent passes back a config with different blockchain/network, ignore it
      console.log('Same feed - preserving local state (blockchain:', localConfig.blockchain, 'network:', localConfig.network, ')')
      return
    }

    if (config && isDifferentFeed) {
      // This is a different feed - update everything EXCEPT blockchain/network
      // ALWAYS preserve blockchain/network from localConfig if it exists
      lastConfigIdRef.current = currentConfigId
      
      // CRITICAL: Always preserve blockchain/network from localConfig
      // This ensures user selections are NEVER overwritten
      const preservedBlockchain = localConfig?.blockchain ?? config.blockchain
      const preservedNetwork = localConfig?.network ?? config.network
      
      const configToSet = {
        ...config,
        blockchain: preservedBlockchain,
        network: preservedNetwork,
      }
      
      setLocalConfig(configToSet)
      // Initialize sources if empty
      if (config.dataSources.length === 0) {
        const defaultSources = AVAILABLE_SOURCES.slice(0, 3).map(s => ({ ...s }))
        const updatedConfig = { ...configToSet, dataSources: defaultSources }
        setLocalConfig(updatedConfig)
        onConfigChange(updatedConfig)
      }
    } else if (!config && !localConfig) {
      // Create default config only if we don't have one
      const defaultConfig: FeedConfig = {
        name: 'BTC/USD Feed',
        symbol: 'BTC/USD',
        dataSources: AVAILABLE_SOURCES.slice(0, 3).map(s => ({ ...s })),
        aggregator: { type: 'median' },
        updateInterval: 60,
        decimals: 8,
        blockchain: 'solana',
        network: 'mainnet',
        enabled: true,
      }
      lastConfigIdRef.current = undefined
      setLocalConfig(defaultConfig)
      onConfigChange(defaultConfig)
    }
    // If config exists but hasn't changed (by ID or content), DO NOTHING - preserve local state completely
    // This ensures blockchain/network selections are NEVER overwritten by parent updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.id, config?.symbol, config?.name, config?.updateInterval]) // Update when config ID or key fields change

  // Generate chart data only when symbol changes or on initial load
  useEffect(() => {
    if (!localConfig) return
    
    // Only regenerate if symbol changed
    if (localConfig.symbol !== lastSymbol && currentPrice) {
      const chartData = generateChartData(currentPrice, 24)
      setPriceData(chartData)
      setLastSymbol(localConfig.symbol)
    } else if (priceData.length === 0 && currentPrice) {
      // Initial load
      const chartData = generateChartData(currentPrice, 24)
      setPriceData(chartData)
      setLastSymbol(localConfig.symbol)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localConfig?.symbol, currentPrice])

  // Fetch real prices from APIs
  useEffect(() => {
    if (!localConfig) return

    const fetchPrices = async (updateChart = false) => {
      setIsLoadingPrices(true)
      try {
        // Fetch main price data from CoinGecko (includes volume and change)
        const mainPriceData = await fetchCoinGeckoPrice(localConfig.symbol)
        
        if (mainPriceData) {
          setCurrentPrice(mainPriceData.price)
          setPriceChange(mainPriceData.priceChange24h)
          
          // Only regenerate chart data if explicitly requested
          if (updateChart) {
            const chartData = generateChartData(mainPriceData.price, 24)
            setPriceData(chartData)
          }
        }

        // Fetch prices from all enabled sources
        const sourcePricePromises = localConfig.dataSources
          .filter(s => s.enabled)
          .map(async (source) => {
            try {
              const priceData = await fetchSourcePrice(source.id, localConfig.symbol)
              return { sourceId: source.id, priceData }
            } catch (error) {
              console.error(`Error fetching ${source.name}:`, error)
              return {
                sourceId: source.id,
                priceData: { price: 0, status: 'error' as const, timestamp: new Date() },
              }
            }
          })

        const sourceResults = await Promise.all(sourcePricePromises)
        const prices: Record<string, { price: number; status: 'active' | 'error' }> = {}
        
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
          let aggregated: number
          if (localConfig.aggregator.type === 'median') {
            activePrices.sort((a, b) => a - b)
            aggregated = activePrices[Math.floor(activePrices.length / 2)]
          } else if (localConfig.aggregator.type === 'mean') {
            aggregated = activePrices.reduce((a, b) => a + b, 0) / activePrices.length
          } else {
            // Weighted average
            const weights = localConfig.dataSources
              .filter(s => s.enabled && prices[s.id]?.status === 'active')
              .map(s => s.weight || 1)
            const totalWeight = weights.reduce((a, b) => a + b, 0)
            aggregated = activePrices.reduce((sum, price, i) => 
              sum + price * (weights[i] / totalWeight), 0
            )
          }
          setCurrentPrice(aggregated)
        }
      } catch (error) {
        console.error('Error fetching prices:', error)
      } finally {
        setIsLoadingPrices(false)
      }
    }

    // Fetch immediately (don't update chart on auto-refresh)
    fetchPrices(false)

    // Update every 30 seconds (CoinGecko free tier allows this)
    const interval = setInterval(() => fetchPrices(false), 30000)

    return () => clearInterval(interval)
  }, [localConfig])

  // Manual refresh function for chart
  const handleRefreshPrices = async () => {
    if (!localConfig) return
    setIsLoadingPrices(true)
    try {
      const mainPriceData = await fetchCoinGeckoPrice(localConfig.symbol)
      if (mainPriceData) {
        setCurrentPrice(mainPriceData.price)
        setPriceChange(mainPriceData.priceChange24h)
        const chartData = generateChartData(mainPriceData.price, 24)
        setPriceData(chartData)
      }
      
      // Refresh source prices
      const sourcePricePromises = localConfig.dataSources
        .filter(s => s.enabled)
        .map(async (source) => {
          try {
            const priceData = await fetchSourcePrice(source.id, localConfig.symbol)
            return { sourceId: source.id, priceData }
          } catch (error) {
            return {
              sourceId: source.id,
              priceData: { price: 0, status: 'error' as const, timestamp: new Date() },
            }
          }
        })

      const sourceResults = await Promise.all(sourcePricePromises)
      const prices: Record<string, { price: number; status: 'active' | 'error' }> = {}
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
      console.error('Error refreshing prices:', error)
    } finally {
      setIsLoadingPrices(false)
    }
  }

  const handleConfigUpdate = (updates: Partial<FeedConfig>) => {
    if (!localConfig) return
    
    console.log('handleConfigUpdate called with:', updates)
    
    // CRITICAL: If only network is being updated, use the most recent blockchain value from ref
    // This prevents using stale state when blockchain and network updates happen in quick succession
    const isNetworkOnlyUpdate = updates.network !== undefined && updates.blockchain === undefined
    
    // Track blockchain/network changes BEFORE updating
    if (updates.blockchain !== undefined || updates.network !== undefined) {
      // Update the ref with the new blockchain value if provided
      if (updates.blockchain !== undefined) {
        currentBlockchainRef.current = updates.blockchain
      }
      
      console.log('Blockchain/network update detected:', {
        newBlockchain: updates.blockchain,
        newNetwork: updates.network,
        currentBlockchainFromState: localConfig.blockchain,
        currentBlockchainFromRef: currentBlockchainRef.current,
        currentNetwork: localConfig.network,
        isNetworkOnlyUpdate,
      })
      
      lastBlockchainChangeRef.current = {
        blockchain: updates.blockchain !== undefined ? updates.blockchain : (currentBlockchainRef.current || localConfig.blockchain),
        network: updates.network !== undefined ? updates.network : localConfig.network,
      }
      isLocalUpdateRef.current = true // Mark that we're making a local update
    } else {
      isLocalUpdateRef.current = true // Mark that we're making a local update
    }
    
    // CRITICAL: When updating only network, use the blockchain from ref (most recent value)
    // This ensures we use the blockchain value that was just set, not stale state
    const blockchainToUse = isNetworkOnlyUpdate
      ? (currentBlockchainRef.current || localConfig.blockchain)
      : (updates.blockchain !== undefined ? updates.blockchain : localConfig.blockchain)
    
    const updated = isNetworkOnlyUpdate
      ? { ...localConfig, network: updates.network ?? localConfig.network, blockchain: blockchainToUse }
      : { ...localConfig, ...updates, blockchain: blockchainToUse, network: updates.network ?? localConfig.network }
    
    // Update the ref to match the new state
    if (updated.blockchain) {
      currentBlockchainRef.current = updated.blockchain
    }
    
    console.log('Updating localConfig to:', updated.blockchain, updated.network)
    // CRITICAL: Update local state IMMEDIATELY - this is what the UI reads from
    setLocalConfig(updated)
    
    // Notify parent asynchronously using queueMicrotask to ensure local state is committed
    // This prevents the parent's update from triggering useEffect before we're ready
    queueMicrotask(() => {
      console.log('Notifying parent of config change')
      onConfigChange(updated)
    })
  }

  const toggleSource = (sourceId: string) => {
    if (!localConfig) return
    playPickupSound()
    const updatedSources = localConfig.dataSources.map(s =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    )
    handleConfigUpdate({ dataSources: updatedSources })
  }

  const addSource = (source: DataSource) => {
    if (!localConfig) return
    if (localConfig.dataSources.find(s => s.id === source.id)) return
    playPickupSound()
    handleConfigUpdate({ dataSources: [...localConfig.dataSources, { ...source }] })
  }

  const removeSource = (sourceId: string) => {
    if (!localConfig) return
    handleConfigUpdate({
      dataSources: localConfig.dataSources.filter(s => s.id !== sourceId),
    })
  }

  const handleSave = async () => {
    if (!localConfig) return
    
    playPickupSound()
    
    // Generate ID if doesn't exist
    const feedToSave: FeedConfig = {
      ...localConfig,
      id: localConfig.id || `feed-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: localConfig.createdAt || new Date(),
    }
    
    // In production, this would save to a backend
    // For now, save to localStorage (in production, would use wallet address)
    const savedFeeds = localStorage.getItem('savedFeeds')
    const feeds = savedFeeds ? JSON.parse(savedFeeds) : []
    const existingIndex = feeds.findIndex((f: FeedConfig) => f.id === feedToSave.id)
    
    if (existingIndex >= 0) {
      feeds[existingIndex] = feedToSave
    } else {
      feeds.push(feedToSave)
    }
    
    localStorage.setItem('savedFeeds', JSON.stringify(feeds))
    alert('Feed saved! Check your profile to manage saved feeds.')
  }

  const handleDeploy = async () => {
    if (!localConfig) return
    playPickupSound()
    console.log('Deploying feed:', localConfig)
    alert('Feed deployed! (This is a demo - in production, this would deploy to Switchboard)')
  }

  if (!localConfig) {
    return (
      <div className="bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-10 text-center">
        <div className="text-lg font-semibold text-feedgod-primary mb-1.5">Loading Feed Builder...</div>
      </div>
    )
  }

  const enabledSources = localConfig.dataSources.filter(s => s.enabled)
  const availableToAdd = AVAILABLE_SOURCES.filter(
    s => !localConfig.dataSources.find(ds => ds.id === s.id)
  )

  return (
      <div className="space-y-5">
        {/* Price Display */}
        <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-bold text-feedgod-primary">{localConfig.symbol}</h2>
                {priceChange !== null && (
                  priceChange >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )
                )}
              </div>
              {isLoadingPrices || currentPrice === null ? (
                <div className="text-4xl font-bold text-feedgod-pink-400 mb-1.5">Loading...</div>
              ) : (
                <>
                  <p className="text-5xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink mb-2">
                    ${formatPrice(currentPrice)}
                  </p>
                  <p className={`text-base font-medium mb-3 ${priceChange !== null && priceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {priceChange !== null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` : 'N/A'} (24h)
                  </p>
                  <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                    Aggregated from {enabledSources.length} source{enabledSources.length !== 1 ? 's' : ''} using {localConfig.aggregator.type} method
                  </p>
                </>
              )}
            </div>
            <button
              onClick={handleRefreshPrices}
              className="p-2 hover:bg-feedgod-pink-100 rounded-lg transition-colors star-glow"
              title="Refresh prices"
            >
              <RefreshCw className="w-4 h-4 text-feedgod-pink-500 hover:text-feedgod-primary" />
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Feed Configuration */}
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-5 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-feedgod-primary mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Feed Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Symbol */}
              <div>
                <label className="block text-xs font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-1.5">Symbol</label>
                <input
                  type="text"
                  value={localConfig.symbol}
                  onChange={(e) => handleConfigUpdate({ symbol: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="BTC/USD"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-feedgod-dark mb-1.5">Feed Name</label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  placeholder="My Custom Feed"
                />
              </div>

              {/* Update Interval */}
              <div>
                <label className="block text-xs font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-1.5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Update Interval (seconds)
                </label>
                <input
                  type="number"
                  value={localConfig.updateInterval}
                  onChange={(e) => handleConfigUpdate({ updateInterval: parseInt(e.target.value) || 60 })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  min="1"
                />
                <p className="text-[10px] text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-0.5">
                  Updates every {localConfig.updateInterval}s
                </p>
              </div>

              {/* Decimals */}
              <div>
                <label className="block text-xs font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-1.5 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Decimal Precision
                </label>
                <input
                  type="number"
                  value={localConfig.decimals}
                  onChange={(e) => handleConfigUpdate({ decimals: parseInt(e.target.value) || 8 })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  min="0"
                  max="18"
                />
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                  {localConfig.decimals} decimal places
                </p>
              </div>

              {/* Chain Selector */}
              <div className="md:col-span-2">
                <ChainSelector
                  blockchain={localConfig.blockchain}
                  network={localConfig.network}
                  onBlockchainChange={(blockchain) => handleConfigUpdate({ blockchain })}
                  onNetworkChange={(network) => handleConfigUpdate({ network })}
                />
              </div>

              {/* Aggregator Type */}
              <div>
                <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">Aggregation Method</label>
                <select
                  value={localConfig.aggregator.type}
                  onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, type: e.target.value as any } })}
                  className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                >
                  <option value="median">Median (Most Robust)</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="weighted">Weighted Average</option>
                </select>
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                  {localConfig.aggregator.type === 'median' && 'Uses middle value from all sources'}
                  {localConfig.aggregator.type === 'mean' && 'Averages all source prices'}
                  {localConfig.aggregator.type === 'weighted' && 'Weights by source reliability'}
                </p>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-5 pt-5 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
              <h4 className="text-xs font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-3">Advanced Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">Min Sources Required</label>
                  <input
                    type="number"
                    value={localConfig.aggregator.minSources || 2}
                    onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, minSources: parseInt(e.target.value) || 2 } })}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                    min="1"
                    max={localConfig.dataSources.length}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">Deviation Threshold (%)</label>
                  <input
                    type="number"
                    value={localConfig.aggregator.deviationThreshold ? localConfig.aggregator.deviationThreshold * 100 : 5}
                    onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, deviationThreshold: (parseFloat(e.target.value) || 5) / 100 } })}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-3 py-1.5 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Source Selection */}
        <div className="space-y-5">
          <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-5 backdrop-blur-sm">
            <h3 className="text-base font-semibold text-feedgod-primary mb-3">Data Sources</h3>
            <p className="text-xs text-feedgod-pink-500 mb-3">
              Select which sources to use for price aggregation
            </p>

            {/* Selected Sources */}
            <div className="space-y-2 mb-3 max-h-[400px] overflow-y-auto">
              {localConfig.dataSources.map((source) => {
                const sourcePrice = sourcePrices[source.id]
                return (
                  <div
                    key={source.id}
                    className="bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg p-3 border border-feedgod-pink-200 dark:border-feedgod-dark-accent"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={() => toggleSource(source.id)}
                          className="w-4 h-4 rounded border-feedgod-pink-300 dark:border-feedgod-dark-accent bg-white dark:bg-feedgod-dark-secondary text-feedgod-primary dark:text-feedgod-neon-pink focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink cursor-pointer star-glow-on-hover"
                        />
                        <div>
                          <p className="text-feedgod-dark dark:text-feedgod-neon-cyan font-medium">{source.name}</p>
                          <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 capitalize">{source.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSource(source.id)}
                        className="text-red-500 hover:text-red-600 text-sm star-glow"
                      >
                        Remove
                      </button>
                    </div>
                    {source.enabled && sourcePrice && (
                      <div className="mt-3 pt-3 border-t border-feedgod-pink-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-feedgod-pink-500">Price</span>
                          <div className="flex items-center gap-2">
                            {sourcePrice.status === 'active' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                              <span className={`text-sm font-medium ${
                                sourcePrice.status === 'active' ? 'text-feedgod-dark dark:text-feedgod-neon-cyan' : 'text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50'
                              }`}>
                              ${formatPrice(sourcePrice.price)}
                            </span>
                          </div>
                        </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Weight</span>
                          <input
                            type="number"
                            value={source.weight || 1}
                            onChange={(e) => {
                              const updated = localConfig.dataSources.map(s =>
                                s.id === source.id ? { ...s, weight: parseFloat(e.target.value) || 1 } : s
                              )
                              handleConfigUpdate({ dataSources: updated })
                            }}
                            className="w-20 bg-white dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded px-2 py-1 text-sm text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add Source */}
            <div className="mt-4 space-y-2">
              {availableToAdd.length > 0 && (
                <details className="mb-2">
                  <summary className="text-sm text-feedgod-primary cursor-pointer hover:text-feedgod-secondary star-glow">
                    + Add Pre-built Sources ({availableToAdd.length} available)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {availableToAdd.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => addSource(source)}
                        className="w-full text-left p-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded-lg transition-colors star-glow-on-hover"
                      >
                        <div className="font-medium text-feedgod-dark dark:text-feedgod-neon-cyan text-sm">{source.name}</div>
                        <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 capitalize mt-1">{source.type}</div>
                      </button>
                    ))}
                  </div>
                </details>
              )}
              <button
                onClick={() => setShowCustomModal(true)}
                className="w-full text-left p-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary rounded-lg transition-colors flex items-center gap-2 star-glow-on-hover"
              >
                <Plus className="w-4 h-4 text-feedgod-primary" />
                <span className="text-sm font-medium text-feedgod-primary">Add Custom Source</span>
              </button>
            </div>

            {/* Aggregated Price Info */}
            <div className="mt-6 pt-6 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Aggregated Price</span>
                <span className="text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan capitalize">
                  {localConfig.aggregator.type}
                </span>
              </div>
              {isLoadingPrices || currentPrice === null ? (
                <p className="text-2xl font-bold text-feedgod-pink-400">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
                  ${formatPrice(currentPrice)}
                </p>
              )}
              <p className="text-xs text-feedgod-pink-500 mt-1">
                {enabledSources.length} active source{enabledSources.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Cost Estimation */}
          {localConfig && (
            <CostEstimateDisplay 
              blockchain={localConfig.blockchain}
              network={localConfig.network}
              operationType="feed"
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-feedgod-pink-200 dark:bg-feedgod-dark-secondary hover:bg-feedgod-pink-300 dark:hover:bg-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              className="flex-1 px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Play className="w-4 h-4" />
              Deploy
            </button>
          </div>
        </div>
      </div>

      {/* Custom Source Modal */}
      <CustomSourceModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={(source) => addSource(source)}
      />
    </div>
  )
}
