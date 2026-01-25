'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Swords, 
  ShoppingCart, 
  Gamepad2, 
  Plane, 
  Cloud, 
  Users, 
  UtensilsCrossed,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  ArrowUpToLine,
  ArrowDownToLine,
  Lock
} from 'lucide-react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import Header from '@/components/Header'
import ArenaMarketCard from '@/components/arena/ArenaMarketCard'
import Leaderboard from '@/components/arena/Leaderboard'
import PointsDisplay from '@/components/arena/PointsDisplay'
import BalanceDisplay from '@/components/arena/BalanceDisplay'
import PredictionModal from '@/components/arena/PredictionModal'
import DepositModal from '@/components/arena/DepositModal'
import WithdrawModal from '@/components/arena/WithdrawModal'
import YourPositions from '@/components/arena/YourPositions'
import { Market, MarketCategory, CATEGORY_INFO, PredictionDirection, ARENA_CONFIG } from '@/types/arena'
import { getAllMarkets, updateMarketValue, getMarketsByCategory } from '@/lib/arena-api'
import { getUserStats } from '@/lib/arena-storage'
import { getArenaBalance, getUserId, initializeUserBalance, DEMO_MODE } from '@/lib/arena-wallet'
import { playPickupSound } from '@/lib/sound-utils'

const CATEGORY_TABS: { value: MarketCategory | 'all'; label: string; icon: typeof ShoppingCart }[] = [
  { value: 'all', label: 'All Markets', icon: Sparkles },
  { value: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'weather', label: 'Weather', icon: Cloud },
  { value: 'social', label: 'Social', icon: Users },
  { value: 'food', label: 'Food', icon: UtensilsCrossed },
]

// Cache key for arena markets
const MARKETS_CACHE_KEY = 'arena_markets_cache'
const CACHE_DURATION = 60000 // 1 minute

export default function ArenaPage() {
  const { address, isConnected } = useAppKitAccount()
  const { open: openWalletModal } = useAppKit()
  
  // For backwards compatibility with existing code
  const connected = isConnected
  const publicKey = address ? { toString: () => address } : null
  
  // Initialize markets immediately from cache or generate
  const [markets, setMarkets] = useState<Market[]>(() => {
    // Try to load from cache first for instant display
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(MARKETS_CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            return data
          }
        } catch {}
      }
    }
    // Generate fresh markets if no cache
    return getAllMarkets()
  })
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'all'>('all')
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [predictionDirection, setPredictionDirection] = useState<PredictionDirection>('up')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false) // Start with false since we have data
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [arenaBalance, setArenaBalance] = useState(0)

  // Load arena balance
  useEffect(() => {
    const loadBalance = () => {
      const userId = getUserId(publicKey?.toString())
      
      // Initialize balance for new users (gives starting funds in demo mode)
      initializeUserBalance(userId)
      
      // Get balance from the new wallet system
      setArenaBalance(getArenaBalance(userId))
    }
    
    loadBalance()
    
    // Refresh balance periodically
    const interval = setInterval(loadBalance, 2000)
    return () => clearInterval(interval)
  }, [publicKey])

  // Cache markets when they change
  useEffect(() => {
    if (markets.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(MARKETS_CACHE_KEY, JSON.stringify({
        data: markets,
        timestamp: Date.now()
      }))
    }
  }, [markets])

  // Simulate market updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets(prev => prev.map(market => updateMarketValue(market)))
      setLastUpdate(new Date())
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(() => {
    playPickupSound()
    setIsLoading(true)
    setTimeout(() => {
      setMarkets(prev => prev.map(market => updateMarketValue(market)))
      setLastUpdate(new Date())
      setIsLoading(false)
    }, 500)
  }, [])

  const handlePredict = (market: Market, direction: PredictionDirection) => {
    // In demo mode, no wallet needed
    // In production mode, require wallet connection
    if (!DEMO_MODE && !connected) {
      openWalletModal()
      return
    }
    setSelectedMarket(market)
    setPredictionDirection(direction)
    setIsModalOpen(true)
  }

  const handlePredictionSuccess = () => {
    setIsModalOpen(false)
    setSelectedMarket(null)
    setMarkets(prev => [...prev])
    // Refresh balance after bet
    const userId = getUserId(publicKey?.toString())
    setArenaBalance(getArenaBalance(userId))
  }

  const handleDepositSuccess = () => {
    // Refresh balance
    const userId = getUserId(publicKey?.toString())
    setArenaBalance(getArenaBalance(userId))
  }

  const handleWithdrawSuccess = () => {
    const userId = getUserId(publicKey?.toString())
    setArenaBalance(getArenaBalance(userId))
  }

  const handleClaimSuccess = () => {
    const userId = getUserId(publicKey?.toString())
    setArenaBalance(getArenaBalance(userId))
  }

  const filteredMarkets = getMarketsByCategory(markets, selectedCategory)

  return (
    <main className="min-h-screen bg-[#1D1E19]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Demo Mode Banner */}
        {DEMO_MODE && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/80 px-3 py-2 rounded-lg text-center text-xs mb-4 flex items-center justify-center gap-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="font-medium">Demo Mode</span>
          </div>
        )}

        {/* Hero Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Swords className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            Predict real-world outcomes and compete for the top of the leaderboard.
          </p>
        </div>

        {/* Wallet Connection Overlay - Only show in production mode */}
        {!DEMO_MODE && !connected && (
          <div className="mb-6 bg-[#252620] border border-[#3a3b35] rounded-lg p-6 text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">Connect Wallet to Play</h2>
            <p className="text-gray-500 mb-4 max-w-md mx-auto text-sm">
              Connect your wallet to deposit USDC, place bets, and compete on the leaderboard.
            </p>
            <button
              onClick={() => openWalletModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-bg rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Markets */}
          <div className="lg:col-span-3 space-y-6">
            {/* Points & Category Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Mobile Points Display */}
              <div className="sm:hidden w-full">
                <PointsDisplay compact />
              </div>
              
              {/* Category Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                {CATEGORY_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        playPickupSound()
                        setSelectedCategory(tab.value)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === tab.value
                          ? 'bg-feedgod-primary text-white'
                          : 'bg-[#252620] text-gray-500 hover:text-gray-300 hover:bg-[#2a2b25]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#252620] hover:bg-[#2a2b25] rounded-md text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            
            {/* Last Update */}
            <p className="text-[10px] text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            
            {/* Markets Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#252620] rounded-lg border border-[#3a3b35] h-72 animate-pulse" />
                ))}
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-10">
                <TrendingUp className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No markets available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMarkets.map((market) => (
                  <ArenaMarketCard
                    key={market.id}
                    market={market}
                    onPredict={handlePredict}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Sidebar - Reordered */}
          <div className="space-y-3">
            {/* 1. Portfolio/Balance */}
            <div className="hidden sm:block">
              <BalanceDisplay />
            </div>
            
            {/* 2. Deposit/Withdraw Buttons */}
            {(DEMO_MODE || connected) && (
              <div className="hidden sm:grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-md text-gray-500 hover:text-gray-300 text-[11px] transition-all"
                >
                  <ArrowUpToLine className="w-3 h-3" />
                  Deposit
                </button>
                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#252620] hover:bg-[#2a2b25] border border-[#3a3b35] rounded-md text-gray-500 hover:text-gray-300 text-[11px] transition-all"
                >
                  <ArrowDownToLine className="w-3 h-3" />
                  Withdraw
                </button>
              </div>
            )}
            
            {/* 3. Points & Stats */}
            <div className="hidden sm:block">
              <PointsDisplay showStats />
            </div>
            
            {/* 4. Your Positions */}
            <YourPositions onClaimSuccess={handleClaimSuccess} />
            
            {/* 5. Leaderboard */}
            <Leaderboard />
          </div>
        </div>
      </div>
      
      {/* Prediction Modal */}
      {selectedMarket && (
        <PredictionModal
          market={selectedMarket}
          direction={predictionDirection}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handlePredictionSuccess}
        />
      )}

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={handleDepositSuccess}
        currentArenaBalance={arenaBalance}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={handleWithdrawSuccess}
        currentArenaBalance={arenaBalance}
      />
    </main>
  )
}
