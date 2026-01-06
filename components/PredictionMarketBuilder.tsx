'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Activity, 
  Play, 
  Save, 
  ChevronRight,
  ExternalLink,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  DollarSign
} from 'lucide-react'
import { 
  PredictionMarket, 
  PredictionPlatform, 
  PredictionOracleConfig,
  MarketSearchFilters 
} from '@/types/prediction'
import { Blockchain, Network } from '@/types/feed'
import { 
  fetchAllMarkets, 
  formatVolume, 
  formatProbability, 
  getTimeUntilClose,
  getAvailableCategories 
} from '@/lib/prediction-api'
import { playPickupSound } from '@/lib/sound-utils'
import { useCostEstimate } from '@/lib/use-cost-estimate'
import ChainSelector from './ChainSelector'

type BuilderStep = 'browse' | 'configure' | 'preview'

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

// Platform icons/logos - using actual brand logos
const PlatformLogo = ({ platform, size = 'sm' }: { platform: PredictionPlatform, size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }
  
  if (platform === 'polymarket') {
    return (
      <img 
        src="/polymarket.avif" 
        alt="Polymarket" 
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  
  return (
    <img 
      src="/kalshi.jpeg" 
      alt="Kalshi" 
      className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
    />
  )
}

// Cost Estimate Display
function CostEstimateDisplay({ 
  blockchain, 
  network, 
}: { 
  blockchain: string
  network: string
}) {
  const { estimate, isLoading } = useCostEstimate(
    blockchain as Blockchain,
    network as Network,
    'function'
  )

  if (isLoading || !estimate) {
    return (
      <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4 animate-pulse" />
          <span>Calculating deployment cost...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
          <DollarSign className="w-4 h-4" />
          <span>Estimated Cost:</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
            {estimate.estimatedCost} {estimate.currency}
          </div>
          {estimate.usdEstimate && (
            <div className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
              {estimate.usdEstimate}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Market Card Component
function MarketCard({ 
  market, 
  isSelected, 
  onSelect 
}: { 
  market: PredictionMarket
  isSelected: boolean
  onSelect: () => void 
}) {
  const yesPrice = market.currentPrices['yes'] || market.outcomes[0]?.price || 0
  const noPrice = market.currentPrices['no'] || market.outcomes[1]?.price || 0
  
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 border-feedgod-primary dark:border-feedgod-neon-pink ring-2 ring-feedgod-primary/20 dark:ring-feedgod-neon-pink/20' 
          : 'bg-white/60 dark:bg-feedgod-dark-secondary/80 border-feedgod-pink-200 dark:border-feedgod-dark-accent hover:border-feedgod-primary/50 dark:hover:border-feedgod-neon-pink/50'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <PlatformLogo platform={market.platform} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-feedgod-dark dark:text-white text-sm leading-tight mb-2 line-clamp-2">
            {market.title}
          </h4>
          
          {/* Odds Display */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-green-600 dark:text-green-400 font-medium">YES</span>
                <span className="text-feedgod-dark dark:text-white font-bold">{formatProbability(yesPrice)}</span>
              </div>
              <div className="h-1.5 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${yesPrice * 100}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-red-500 dark:text-red-400 font-medium">NO</span>
                <span className="text-feedgod-dark dark:text-white font-bold">{formatProbability(noPrice)}</span>
              </div>
              <div className="h-1.5 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 dark:bg-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${noPrice * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeUntilClose(new Date(market.endDate))}</span>
            </div>
            {market.volume && (
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>{formatVolume(market.volume)}</span>
              </div>
            )}
            {market.category && (
              <span className="px-1.5 py-0.5 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent rounded text-[10px] uppercase tracking-wide">
                {market.category}
              </span>
            )}
          </div>
        </div>
        
        {isSelected && (
          <CheckCircle2 className="w-5 h-5 text-feedgod-primary dark:text-feedgod-neon-pink flex-shrink-0" />
        )}
      </div>
    </div>
  )
}

export default function PredictionMarketBuilder() {
  const [step, setStep] = useState<BuilderStep>('browse')
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<PredictionPlatform | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  
  // Oracle config state
  const [oracleConfig, setOracleConfig] = useState<Partial<PredictionOracleConfig>>({
    blockchain: 'solana',
    network: 'mainnet',
    updateInterval: 3600, // 1 hour
    autoResolve: true,
    resolutionType: 'binary',
  })
  
  const categories = getAvailableCategories()

  // Fetch markets on mount and when filters change
  useEffect(() => {
    const loadMarkets = async () => {
      setIsLoading(true)
      try {
        const filters: MarketSearchFilters = {
          searchQuery: searchQuery || undefined,
          platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        }
        const data = await fetchAllMarkets(filters)
        setMarkets(data)
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    const debounce = setTimeout(loadMarkets, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, selectedPlatform, selectedCategory])

  const handleSelectMarket = (market: PredictionMarket) => {
    playPickupSound()
    setSelectedMarket(market)
    setOracleConfig(prev => ({
      ...prev,
      name: `${market.title} Oracle`,
      description: market.description,
      market: market,
      resolutionType: market.outcomes.length === 2 ? 'binary' : 'multi-outcome',
    }))
  }

  const handleContinue = () => {
    if (!selectedMarket) return
    playPickupSound()
    setStep('configure')
  }

  const handlePreview = () => {
    playPickupSound()
    setStep('preview')
  }

  const handleBack = () => {
    playPickupSound()
    if (step === 'preview') setStep('configure')
    else if (step === 'configure') setStep('browse')
  }

  const handleDeploy = () => {
    playPickupSound()
    console.log('Deploying oracle:', oracleConfig)
    alert('Oracle deployed! (This is a demo - in production, this would deploy to Switchboard)')
  }

  const handleSave = () => {
    playPickupSound()
    // Save to localStorage
    const savedOracles = localStorage.getItem('savedPredictionOracles')
    const oracles = savedOracles ? JSON.parse(savedOracles) : []
    oracles.push({
      ...oracleConfig,
      id: `oracle-${Date.now()}`,
      createdAt: new Date(),
    })
    localStorage.setItem('savedPredictionOracles', JSON.stringify(oracles))
    alert('Oracle configuration saved!')
  }

  const handleRefresh = async () => {
    playPickupSound()
    setIsLoading(true)
    try {
      const filters: MarketSearchFilters = {
        searchQuery: searchQuery || undefined,
        platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      }
      const data = await fetchAllMarkets(filters)
      setMarkets(data)
    } catch (error) {
      console.error('Error refreshing markets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate the Switchboard config preview
  const generateSwitchboardConfig = () => {
    if (!selectedMarket) return null
    
    return {
      name: oracleConfig.name,
      description: oracleConfig.description,
      chain: oracleConfig.blockchain,
      network: oracleConfig.network,
      updateInterval: oracleConfig.updateInterval,
      source: {
        type: 'prediction_market',
        platform: selectedMarket.platform,
        marketId: selectedMarket.id,
        marketUrl: selectedMarket.marketUrl,
      },
      resolution: {
        type: oracleConfig.resolutionType,
        outcomes: selectedMarket.outcomes.map((o, i) => ({
          name: o.name,
          value: oracleConfig.resolutionType === 'binary' 
            ? (o.name.toLowerCase() === 'yes' ? 1 : 0)
            : i,
        })),
        autoResolve: oracleConfig.autoResolve,
      },
      output: {
        type: 'uint8',
        description: oracleConfig.resolutionType === 'binary'
          ? 'Returns 1 for YES, 0 for NO'
          : `Returns outcome index (0-${selectedMarket.outcomes.length - 1})`,
      },
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with step indicator */}
      <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-feedgod-primary dark:text-feedgod-neon-pink">
                Prediction Market Oracle
              </h2>
              <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                Create on-chain oracles for Polymarket & Kalshi markets
              </p>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              step === 'browse' 
                ? 'bg-feedgod-primary text-white' 
                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70'
            }`}>
              1. Browse
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-pink-300 dark:text-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              step === 'configure' 
                ? 'bg-feedgod-primary text-white' 
                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70'
            }`}>
              2. Configure
            </div>
            <ChevronRight className="w-4 h-4 text-feedgod-pink-300 dark:text-feedgod-dark-accent" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              step === 'preview' 
                ? 'bg-feedgod-primary text-white' 
                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70'
            }`}>
              3. Deploy
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-center gap-6 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 pt-4 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Oracle outputs <strong className="text-feedgod-dark dark:text-white">1</strong> for YES, <strong className="text-feedgod-dark dark:text-white">0</strong> for NO</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Auto-resolves when market closes</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Perfect for DeFi integrations</span>
          </div>
        </div>
      </div>

      {/* Step 1: Browse Markets */}
      {step === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and filters */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search markets... (e.g., Bitcoin, Trump, weather)"
                    className="w-full pl-10 pr-4 py-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-dark dark:text-white placeholder-feedgod-pink-400 dark:placeholder-feedgod-neon-cyan/50 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  />
                </div>
                
                <button
                  onClick={handleRefresh}
                  className="p-2 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:border-feedgod-primary dark:hover:border-feedgod-neon-pink transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {/* Filters - always visible */}
              <div className="mt-4 pt-4 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent">
                  <div className="flex flex-wrap gap-4">
                    {/* Platform filter */}
                    <div>
                      <label className="block text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-2">Platform</label>
                      <div className="flex gap-2">
                        {(['all', 'polymarket', 'kalshi'] as const).map((platform) => (
                          <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedPlatform === platform
                                ? 'bg-feedgod-primary text-white dark:bg-feedgod-neon-pink'
                                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary'
                            }`}
                          >
                            {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Category filter */}
                    <div>
                      <label className="block text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-2">Category</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedCategory === 'all'
                              ? 'bg-feedgod-primary text-white dark:bg-feedgod-neon-pink'
                              : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary'
                          }`}
                        >
                          All
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              selectedCategory === cat
                                ? 'bg-feedgod-primary text-white dark:bg-feedgod-neon-pink'
                                : 'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Markets list */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink mx-auto mb-4" />
                  <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Loading markets...</p>
                </div>
              ) : markets.length === 0 ? (
                <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-12 text-center">
                  <Search className="w-8 h-8 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50 mx-auto mb-4" />
                  <p className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">No markets found. Try adjusting your search.</p>
                </div>
              ) : (
                markets.map((market) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    isSelected={selectedMarket?.id === market.id}
                    onSelect={() => handleSelectMarket(market)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Selected market details / Continue */}
          <div className="space-y-4">
            {selectedMarket ? (
              <>
                <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <PlatformLogo platform={selectedMarket.platform} />
                    <span className="text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 uppercase tracking-wide">
                      {selectedMarket.platform}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-feedgod-dark dark:text-white mb-3">
                    {selectedMarket.title}
                  </h3>
                  
                  <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-4 line-clamp-4">
                    {selectedMarket.description}
                  </p>
                  
                  {/* Current odds */}
                  <div className="bg-feedgod-pink-50 dark:bg-feedgod-dark-accent rounded-lg p-4 mb-4">
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mb-3">Current Odds</p>
                    <div className="space-y-2">
                      {selectedMarket.outcomes.map((outcome) => (
                        <div key={outcome.id} className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            outcome.name.toLowerCase() === 'yes' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {outcome.name}
                          </span>
                          <span className="text-lg font-bold text-feedgod-dark dark:text-white">
                            {formatProbability(selectedMarket.currentPrices[outcome.id] || outcome.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Oracle output preview */}
                  <div className="bg-gradient-to-r from-feedgod-primary/10 to-purple-500/10 dark:from-feedgod-neon-pink/10 dark:to-purple-500/10 rounded-lg p-4 border border-feedgod-primary/20 dark:border-feedgod-neon-pink/20">
                    <p className="text-xs text-feedgod-primary dark:text-feedgod-neon-pink font-medium mb-2">Oracle Output</p>
                    <p className="text-sm text-feedgod-dark dark:text-white">
                      Will resolve to <strong className="text-green-600 dark:text-green-400">1</strong> for YES or <strong className="text-red-500 dark:text-red-400">0</strong> for NO
                    </p>
                  </div>
                  
                  {/* Meta info */}
                  <div className="mt-4 pt-4 border-t border-feedgod-pink-200 dark:border-feedgod-dark-accent space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Closes in</span>
                      <span className="text-feedgod-dark dark:text-white font-medium">
                        {getTimeUntilClose(new Date(selectedMarket.endDate))}
                      </span>
                    </div>
                    {selectedMarket.volume && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Volume</span>
                        <span className="text-feedgod-dark dark:text-white font-medium">
                          {formatVolume(selectedMarket.volume)}
                        </span>
                      </div>
                    )}
                    {selectedMarket.marketUrl && (
                      <a
                        href={selectedMarket.marketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-feedgod-primary dark:text-feedgod-neon-cyan hover:underline mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on {selectedMarket.platform}
                      </a>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleContinue}
                  className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary dark:bg-feedgod-neon-pink dark:hover:bg-feedgod-neon-pink/80 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
                >
                  Continue to Configure
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm text-center">
                <Target className="w-12 h-12 text-feedgod-pink-300 dark:text-feedgod-dark-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-feedgod-dark dark:text-white mb-2">
                  Select a Market
                </h3>
                <p className="text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                  Choose a prediction market from the list to create an oracle for it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Configure Oracle */}
      {step === 'configure' && selectedMarket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Selected market summary */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <PlatformLogo platform={selectedMarket.platform} />
                <div className="flex-1">
                  <h4 className="font-medium text-feedgod-dark dark:text-white text-sm">
                    {selectedMarket.title}
                  </h4>
                  <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                    {selectedMarket.platform} • Closes in {getTimeUntilClose(new Date(selectedMarket.endDate))}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="text-sm text-feedgod-primary dark:text-feedgod-neon-cyan hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Oracle configuration */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-6">
                Oracle Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Oracle name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                    Oracle Name
                  </label>
                  <input
                    type="text"
                    value={oracleConfig.name || ''}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  />
                </div>
                
                {/* Resolution type */}
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
                    Resolution Type
                  </label>
                  <select
                    value={oracleConfig.resolutionType}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, resolutionType: e.target.value as any }))}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  >
                    <option value="binary">Binary (YES=1, NO=0)</option>
                    <option value="multi-outcome">Multi-Outcome (Index)</option>
                  </select>
                  <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                    {oracleConfig.resolutionType === 'binary' 
                      ? 'Returns 1 for YES, 0 for NO'
                      : 'Returns winning outcome index (0, 1, 2, ...)'
                    }
                  </p>
                </div>
                
                {/* Update interval */}
                <div>
                  <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Update Interval
                  </label>
                  <select
                    value={oracleConfig.updateInterval}
                    onChange={(e) => setOracleConfig(prev => ({ ...prev, updateInterval: parseInt(e.target.value) }))}
                    className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                  >
                    <option value="60">Every minute</option>
                    <option value="300">Every 5 minutes</option>
                    <option value="900">Every 15 minutes</option>
                    <option value="3600">Every hour</option>
                    <option value="86400">Daily</option>
                  </select>
                  <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
                    How often to check market status
                  </p>
                </div>
                
                {/* Chain selector */}
                <div className="md:col-span-2">
                  <ChainSelector
                    blockchain={oracleConfig.blockchain || 'solana'}
                    network={oracleConfig.network || 'mainnet'}
                    onBlockchainChange={(blockchain) => setOracleConfig(prev => ({ ...prev, blockchain }))}
                    onNetworkChange={(network) => setOracleConfig(prev => ({ ...prev, network }))}
                  />
                </div>
                
                {/* Auto-resolve toggle */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={oracleConfig.autoResolve}
                      onChange={(e) => setOracleConfig(prev => ({ ...prev, autoResolve: e.target.checked }))}
                      className="w-5 h-5 rounded border-feedgod-pink-300 dark:border-feedgod-dark-accent bg-white dark:bg-feedgod-dark-secondary text-feedgod-primary dark:text-feedgod-neon-pink focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
                    />
                    <div>
                      <span className="text-sm font-medium text-feedgod-dark dark:text-white">
                        Auto-resolve when market closes
                      </span>
                      <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                        Automatically fetch final result when the market end date is reached
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - preview & actions */}
          <div className="space-y-4">
            {/* Quick preview */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                Oracle Preview
              </h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Market</span>
                  <span className="text-feedgod-dark dark:text-white font-medium text-right max-w-[60%] truncate">
                    {selectedMarket.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-feedgod-dark dark:text-white font-medium capitalize">
                      {oracleConfig.blockchain} ({oracleConfig.network})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Output</span>
                  <span className="text-feedgod-dark dark:text-white font-medium">
                    uint8 (0 or 1)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Updates</span>
                  <span className="text-feedgod-dark dark:text-white font-medium">
                    {oracleConfig.updateInterval === 60 && 'Every minute'}
                    {oracleConfig.updateInterval === 300 && 'Every 5 min'}
                    {oracleConfig.updateInterval === 900 && 'Every 15 min'}
                    {oracleConfig.updateInterval === 3600 && 'Hourly'}
                    {oracleConfig.updateInterval === 86400 && 'Daily'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost estimate */}
            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePreview}
                className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary dark:bg-feedgod-neon-pink dark:hover:bg-feedgod-neon-pink/80 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
              >
                Preview & Deploy
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary rounded-lg text-feedgod-dark dark:text-white font-medium transition-colors"
              >
                Back to Markets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Deploy */}
      {step === 'preview' && selectedMarket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Config preview */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                Switchboard Oracle Configuration
              </h3>
              
              <div className="bg-feedgod-dark dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  {JSON.stringify(generateSwitchboardConfig(), null, 2)}
                </pre>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                What happens when you deploy?
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary dark:text-feedgod-neon-pink">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">Oracle Created</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 flex items-center gap-1">
                      A new Switchboard oracle will be deployed on 
                      <img 
                        src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                        alt=""
                        className="w-3 h-3 object-contain inline-block mx-0.5"
                      />
                      <span className="capitalize">{oracleConfig.blockchain} {oracleConfig.network}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary dark:text-feedgod-neon-pink">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">Monitoring Starts</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      The oracle will check {selectedMarket.platform} every {
                        oracleConfig.updateInterval === 60 ? 'minute' :
                        oracleConfig.updateInterval === 300 ? '5 minutes' :
                        oracleConfig.updateInterval === 900 ? '15 minutes' :
                        oracleConfig.updateInterval === 3600 ? 'hour' : 'day'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-feedgod-primary dark:text-feedgod-neon-pink">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-feedgod-dark dark:text-white">Resolution</p>
                    <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                      When the market closes, the oracle will output <strong>1</strong> for YES or <strong>0</strong> for NO
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - final actions */}
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-gradient-to-br from-feedgod-primary/10 to-purple-500/10 dark:from-feedgod-neon-pink/10 dark:to-purple-500/10 rounded-lg border border-feedgod-primary/20 dark:border-feedgod-neon-pink/20 p-6">
              <h4 className="text-sm font-semibold text-feedgod-primary dark:text-feedgod-neon-pink mb-4">
                Ready to Deploy
              </h4>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Oracle</span>
                  <span className="text-feedgod-dark dark:text-white font-medium truncate max-w-[60%]">
                    {oracleConfig.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Chain</span>
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={CHAIN_LOGOS[oracleConfig.blockchain || 'solana']}
                      alt={oracleConfig.blockchain}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-feedgod-dark dark:text-white font-medium capitalize">
                      {oracleConfig.blockchain}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">Network</span>
                  <span className="text-feedgod-dark dark:text-white font-medium capitalize">
                    {oracleConfig.network}
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-feedgod-primary/20 dark:border-feedgod-neon-pink/20">
                <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                  Your smart contracts can read this oracle to get trustless prediction market data on-chain.
                </p>
              </div>
            </div>

            {/* Cost estimate */}
            <CostEstimateDisplay
              blockchain={oracleConfig.blockchain || 'solana'}
              network={oracleConfig.network || 'mainnet'}
            />

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeploy}
                className="w-full px-4 py-3 bg-feedgod-primary hover:bg-feedgod-secondary dark:bg-feedgod-neon-pink dark:hover:bg-feedgod-neon-pink/80 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover"
              >
                <Play className="w-4 h-4" />
                Deploy Oracle
              </button>
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-secondary rounded-lg text-feedgod-dark dark:text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 text-sm text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink transition-colors"
              >
                Back to Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

