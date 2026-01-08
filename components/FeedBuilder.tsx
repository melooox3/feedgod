'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Save, CheckCircle2, XCircle, TrendingUp, TrendingDown, Settings, Clock, Network, Hash, RefreshCw, Plus, DollarSign, Database, Loader2, ExternalLink, Copy, CheckCircle, X, Rocket } from 'lucide-react'
import { FeedConfig, DataSource, Blockchain } from '@/types/feed'
import { fetchCoinGeckoPrice, fetchSourcePrice, generateChartData } from '@/lib/price-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'
import CustomSourceModal from './CustomSourceModal'
import { 
  DeploymentResult, 
  getSolscanLink, 
  generateIntegrationCode,
  storeDeployedFeed 
} from '@/lib/switchboard'
import { useAppKitAccount } from '@reown/appkit/react'

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

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

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
      <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating deployment cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-[#252620] rounded-lg border border-[#3a3b35]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold gradient-text">
            {estimate.estimatedCost} {estimate.currency}
          </div>
          {estimate.usdEstimate && (
            <div className="text-xs text-gray-400">
              {estimate.usdEstimate}
            </div>
          )}
        </div>
      </div>
      {estimate.gasPrice && (
        <div className="mt-2 text-xs text-gray-400">
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
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null)
  const [showDeploymentModal, setShowDeploymentModal] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const isLocalUpdateRef = useRef(false)
  
  // Wallet connection
  const { address, isConnected } = useAppKitAccount()
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

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleDeploy = async () => {
    if (!localConfig) return
    playPickupSound()
    
    // Check wallet connection
    if (!isConnected || !address) {
      alert('Please connect your wallet to deploy a feed.')
      return
    }
    
    setIsDeploying(true)
    setShowDeploymentModal(true)
    setDeploymentResult(null)
    
    try {
      console.log('[FeedBuilder] Starting deployment for:', localConfig.name)
      
      // Prepare config for deployment
      const deployConfig: FeedConfig = {
        ...localConfig,
        dataSources: localConfig.dataSources.filter(s => s.enabled),
      }
      
      // Demo mode - simulate deployment
      // In production, this would call the actual Switchboard SDK
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate network delay
      
      // Generate a demo public key
      const demoPublicKey = `Demo${Math.random().toString(36).substring(2, 10)}...${localConfig.symbol.replace('/', '')}`
      
      const result: DeploymentResult = {
        success: true,
        publicKey: demoPublicKey,
        signature: `demo_sig_${Date.now()}`,
      }
      
      console.log('[FeedBuilder] Deployment result:', result)
      
      setDeploymentResult(result)
      
      if (result.success && result.publicKey) {
        // Store the deployed feed
        storeDeployedFeed(deployConfig, result)
        playPickupSound()
      }
      
    } catch (error) {
      console.error('[FeedBuilder] Deployment error:', error)
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const closeDeploymentModal = () => {
    setShowDeploymentModal(false)
    setDeploymentResult(null)
  }

  if (!localConfig) {
    return (
      <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-12 text-center">
        <div className="text-xl font-semibold text-feedgod-primary dark:text-feedgod-primary mb-2">Loading Feed Builder...</div>
      </div>
    )
  }

  const enabledSources = localConfig.dataSources.filter(s => s.enabled)
  const availableToAdd = AVAILABLE_SOURCES.filter(
    s => !localConfig.dataSources.find(ds => ds.id === s.id)
  )

  return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-feedgod-primary to-pink-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">
                Price Feed Builder
              </h2>
              <p className="text-sm text-gray-400">
                Aggregate real-time price data from multiple sources into reliable on-chain oracles
              </p>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-8 backdrop-blur-sm relative overflow-hidden">
          {/* Subtle chain logo watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-10 pointer-events-none">
            <img 
              src={CHAIN_LOGOS[localConfig.blockchain] || CHAIN_LOGOS.solana} 
              alt="" 
              className="w-48 h-48 object-contain"
            />
          </div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-feedgod-primary dark:text-feedgod-primary">{localConfig.symbol}</h2>
                {/* Chain badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-full">
                  <img 
                    src={CHAIN_LOGOS[localConfig.blockchain] || CHAIN_LOGOS.solana}
                    alt={localConfig.blockchain}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs font-medium text-gray-400 capitalize">
                    {localConfig.blockchain}
                  </span>
                </div>
                {priceChange !== null && (
                  priceChange >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )
                )}
              </div>
              {isLoadingPrices || currentPrice === null ? (
                <div className="text-5xl font-bold text-gray-400 mb-2">Loading...</div>
              ) : (
                <>
                  <p className="text-6xl font-bold gradient-text mb-3">
                    ${formatPrice(currentPrice)}
                  </p>
                  <p className={`text-lg font-medium mb-4 ${priceChange !== null && priceChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {priceChange !== null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` : 'N/A'} (24h)
                  </p>
                  <p className="text-sm text-gray-400">
                    Aggregated from {enabledSources.length} source{enabledSources.length !== 1 ? 's' : ''} using {localConfig.aggregator.type} method
                  </p>
                </>
              )}
            </div>
            <button
              onClick={handleRefreshPrices}
              className="p-3 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent rounded-lg transition-colors star-glow"
              title="Refresh prices"
            >
              <RefreshCw className="w-5 h-5 text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary" />
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Feed Configuration */}
          <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Feed Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Symbol</label>
                <input
                  type="text"
                  value={localConfig.symbol}
                  onChange={(e) => handleConfigUpdate({ symbol: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="BTC/USD"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Feed Name</label>
                <input
                  type="text"
                  value={localConfig.name}
                  onChange={(e) => handleConfigUpdate({ name: e.target.value })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  placeholder="My Custom Feed"
                />
              </div>

              {/* Update Interval */}
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Update Interval (seconds)
                </label>
                <input
                  type="number"
                  value={localConfig.updateInterval}
                  onChange={(e) => handleConfigUpdate({ updateInterval: parseInt(e.target.value) || 60 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Updates every {localConfig.updateInterval}s
                </p>
              </div>

              {/* Decimals */}
              <div>
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Decimal Precision
                </label>
                <input
                  type="number"
                  value={localConfig.decimals}
                  onChange={(e) => handleConfigUpdate({ decimals: parseInt(e.target.value) || 8 })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                  min="0"
                  max="18"
                />
                <p className="text-xs text-gray-400 mt-1">
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
                <label className="block text-sm font-medium text-white mb-2">Aggregation Method</label>
                <select
                  value={localConfig.aggregator.type}
                  onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, type: e.target.value as any } })}
                  className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                >
                  <option value="median">Median (Most Robust)</option>
                  <option value="mean">Mean (Average)</option>
                  <option value="weighted">Weighted Average</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {localConfig.aggregator.type === 'median' && 'Uses middle value from all sources'}
                  {localConfig.aggregator.type === 'mean' && 'Averages all source prices'}
                  {localConfig.aggregator.type === 'weighted' && 'Weights by source reliability'}
                </p>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="mt-6 pt-6 border-t border-[#3a3b35]">
              <h4 className="text-sm font-medium text-white mb-4">Advanced Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Min Sources Required</label>
                  <input
                    type="number"
                    value={localConfig.aggregator.minSources || 2}
                    onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, minSources: parseInt(e.target.value) || 2 } })}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
                    min="1"
                    max={localConfig.dataSources.length}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Deviation Threshold (%)</label>
                  <input
                    type="number"
                    value={localConfig.aggregator.deviationThreshold ? localConfig.aggregator.deviationThreshold * 100 : 5}
                    onChange={(e) => handleConfigUpdate({ aggregator: { ...localConfig.aggregator, deviationThreshold: (parseFloat(e.target.value) || 5) / 100 } })}
                    className="w-full bg-[#252620] border border-[#3a3b35] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
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
        <div className="space-y-6">
          <div className="bg-feedgod-dark-secondary/60 dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-[#3a3b35] p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-primary mb-4">Data Sources</h3>
            <p className="text-sm text-gray-400 mb-4">
              Select which sources to use for price aggregation
            </p>

            {/* Selected Sources */}
            <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
              {localConfig.dataSources.map((source) => {
                const sourcePrice = sourcePrices[source.id]
                return (
                  <div
                    key={source.id}
                    className="bg-[#252620] rounded-lg p-4 border border-[#3a3b35]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={() => toggleSource(source.id)}
                          className="w-4 h-4 rounded border-feedgod-purple-300 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary gradient-text focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary cursor-pointer star-glow-on-hover"
                        />
                        <div>
                          <p className="text-white font-medium">{source.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{source.type}</p>
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
                      <div className="mt-3 pt-3 border-t border-feedgod-purple-200 dark:border-feedgod-dark-accent">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Price</span>
                          <div className="flex items-center gap-2">
                            {sourcePrice.status === 'active' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                              <span className={`text-sm font-medium ${
                                sourcePrice.status === 'active' ? 'text-white' : 'text-gray-400 /50'
                              }`}>
                              ${formatPrice(sourcePrice.price)}
                            </span>
                          </div>
                        </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">Weight</span>
                          <input
                            type="number"
                            value={source.weight || 1}
                            onChange={(e) => {
                              const updated = localConfig.dataSources.map(s =>
                                s.id === source.id ? { ...s, weight: parseFloat(e.target.value) || 1 } : s
                              )
                              handleConfigUpdate({ dataSources: updated })
                            }}
                            className="w-20 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-[#3a3b35] rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
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
                  <summary className="text-sm text-feedgod-primary dark:text-feedgod-primary cursor-pointer hover:text-feedgod-secondary star-glow">
                    + Add Pre-built Sources ({availableToAdd.length} available)
                  </summary>
                  <div className="mt-2 space-y-2">
                    {availableToAdd.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => addSource(source)}
                        className="w-full text-left p-3 bg-[#252620] hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg transition-colors star-glow-on-hover"
                      >
                        <div className="font-medium text-white text-sm">{source.name}</div>
                        <div className="text-xs text-gray-400 capitalize mt-1">{source.type}</div>
                      </button>
                    ))}
                  </div>
                </details>
              )}
              <button
                onClick={() => setShowCustomModal(true)}
                className="w-full text-left p-3 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent dark:hover:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded-lg transition-colors flex items-center gap-2 star-glow-on-hover"
              >
                <Plus className="w-4 h-4 text-feedgod-primary dark:text-feedgod-primary" />
                <span className="text-sm font-medium text-feedgod-primary dark:text-feedgod-primary">Add Custom Source</span>
              </button>
            </div>

            {/* Aggregated Price Info */}
            <div className="mt-6 pt-6 border-t border-[#3a3b35]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Aggregated Price</span>
                <span className="text-sm font-medium text-white capitalize">
                  {localConfig.aggregator.type}
                </span>
              </div>
              {isLoadingPrices || currentPrice === null ? (
                <p className="text-2xl font-bold text-gray-400">Loading...</p>
              ) : (
                <p className="text-2xl font-bold gradient-text">
                  ${formatPrice(currentPrice)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
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
              className="flex-1 px-4 py-3 bg-feedgod-purple-200 dark:border-feedgod-dark-accent dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary hover:bg-feedgod-purple-300 dark:border-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !isConnected}
              className="flex-1 px-4 py-3 gradient-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 star-glow-on-hover"
              title={!isConnected ? 'Connect wallet to deploy' : ''}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {isConnected ? 'Deploy' : 'Connect Wallet'}
                </>
              )}
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

      {/* Deployment Modal */}
      {showDeploymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded-2xl border border-[#3a3b35] shadow-2xl overflow-hidden relative">
            {/* Subtle chain watermark */}
            <div className="absolute -right-12 -top-12 opacity-5 dark:opacity-10 pointer-events-none">
              <img 
                src={CHAIN_LOGOS[localConfig?.blockchain || 'solana']} 
                alt="" 
                className="w-64 h-64 object-contain"
              />
            </div>
            
            {/* Header */}
            <div className="p-6 border-b border-[#3a3b35] relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative ${
                    isDeploying ? 'bg-feedgod-primary dark:text-feedgod-primary/20' :
                    deploymentResult?.success ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {isDeploying ? (
                      <Loader2 className="w-5 h-5 text-feedgod-primary dark:text-feedgod-primary animate-spin" />
                    ) : deploymentResult?.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {isDeploying ? 'Deploying Feed...' :
                         deploymentResult?.success ? 'Deployment Successful!' : 'Deployment Failed'}
                      </h3>
                      <img 
                        src={CHAIN_LOGOS[localConfig?.blockchain || 'solana']}
                        alt={localConfig?.blockchain}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      {localConfig?.name}
                    </p>
                  </div>
                </div>
                {!isDeploying && (
                  <button
                    onClick={closeDeploymentModal}
                    className="p-2 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isDeploying ? (
                <div className="text-center py-8">
                  <Rocket className="w-16 h-16 text-feedgod-primary dark:text-feedgod-primary mx-auto mb-4 animate-bounce" />
                  <p className="text-white font-medium mb-2">
                    Building and deploying your feed...
                  </p>
                  <p className="text-sm text-gray-400">
                    Please confirm the transaction in your wallet
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-feedgod-primary dark:text-feedgod-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-feedgod-primary dark:text-feedgod-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-feedgod-primary dark:text-feedgod-primary animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              ) : deploymentResult?.success ? (
                <div className="space-y-6">
                  {/* Public Key */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Feed Public Key
                    </label>
                    <div className="flex items-center gap-2 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg p-3">
                      <code className="flex-1 text-sm font-mono gradient-text break-all">
                        {deploymentResult.publicKey}
                      </code>
                      <button
                        onClick={() => handleCopyToClipboard(deploymentResult.publicKey!, 'pubkey')}
                        className="p-2 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded transition-colors flex-shrink-0"
                        title="Copy public key"
                      >
                        {copiedText === 'pubkey' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-3">
                    <a
                      href={getSolscanLink(deploymentResult.publicKey!, localConfig?.network || 'devnet')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Solscan
                    </a>
                  </div>

                  {/* Integration Code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-white">
                        Integration Code
                      </label>
                      <button
                        onClick={() => handleCopyToClipboard(
                          generateIntegrationCode(deploymentResult.publicKey!, localConfig?.name || 'Feed'),
                          'code'
                        )}
                        className="text-xs text-feedgod-primary dark:text-feedgod-primary hover:text-feedgod-secondary flex items-center gap-1"
                      >
                        {copiedText === 'code' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy code
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto max-h-48">
                      <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                        {generateIntegrationCode(deploymentResult.publicKey!, localConfig?.name || 'Feed')}
                      </pre>
                    </div>
                  </div>

                  {/* Transaction Signature */}
                  {deploymentResult.signature && (
                    <div className="text-xs text-gray-400 /60">
                      Transaction: {deploymentResult.signature.slice(0, 20)}...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">
                    Deployment Failed
                  </p>
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg p-3">
                    {deploymentResult?.error || 'Unknown error occurred'}
                  </p>
                  <button
                    onClick={handleDeploy}
                    className="mt-6 px-6 py-2 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isDeploying && deploymentResult?.success && (
              <div className="px-6 pb-6">
                <button
                  onClick={closeDeploymentModal}
                  className="w-full px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
