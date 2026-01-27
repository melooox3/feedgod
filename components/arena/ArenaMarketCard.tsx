'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  ShoppingCart,
  Gamepad2,
  Plane,
  Cloud,
  UtensilsCrossed,
  Package,
  Monitor,
  Fuel,
  Thermometer,
  Droplets,
  Youtube,
  AlertCircle,
  Check,
  LucideIcon
} from 'lucide-react'
import { Market, MarketIconName, CATEGORY_INFO, PredictionDirection } from '@/types/arena'
import { formatValue, getTimeRemaining } from '@/lib/arena/arena-api'
import { getPendingPredictionForMarket } from '@/lib/arena/arena-storage'
import { playPickupSound } from '@/lib/utils/sound-utils'

// Icon mapping
const ICON_MAP: Record<MarketIconName, LucideIcon> = {
  ShoppingCart,
  Gamepad2,
  Plane,
  Cloud,
  Users,
  UtensilsCrossed,
  Package,
  Monitor,
  Twitch: Monitor, // Fallback
  Fuel,
  Thermometer,
  Droplets,
  Youtube,
  Ticket: Package, // Fallback
  Hamburger: UtensilsCrossed, // Fallback
  TrendingUp,
}

interface ArenaMarketCardProps {
  market: Market
  onPredict: (market: Market, direction: PredictionDirection) => void
}

export default function ArenaMarketCard({ market, onPredict }: ArenaMarketCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(new Date(market.resolveAt)))
  const [existingPrediction, setExistingPrediction] = useState(getPendingPredictionForMarket(market.id))
  const [showValue, setShowValue] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(new Date(market.resolveAt)))
    }, 60000)
    return () => clearInterval(interval)
  }, [market.resolveAt])

  useEffect(() => {
    // Animate value appearance
    const timer = setTimeout(() => setShowValue(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setExistingPrediction(getPendingPredictionForMarket(market.id))
  }, [market.id])

  const Icon = ICON_MAP[market.iconName] || TrendingUp
  const categoryInfo = CATEGORY_INFO[market.category] || { 
    label: 'Other', 
    iconName: 'TrendingUp', 
    color: 'from-gray-500 to-slate-500' 
  }
  
  const totalPoints = market.totalUpPoints + market.totalDownPoints
  const upPercent = totalPoints > 0 ? Math.round((market.totalUpPoints / totalPoints) * 100) : 50
  const downPercent = 100 - upPercent
  
  const priceChange = market.currentValue - market.previousValue
  const priceChangePercent = market.previousValue > 0 
    ? ((priceChange / market.previousValue) * 100).toFixed(1) 
    : '0.0'
  
  const hasPredicted = !!existingPrediction

  const handlePredict = (direction: PredictionDirection) => {
    if (hasPredicted) return
    playPickupSound()
    onPredict(market, direction)
  }

  return (
    <div 
      className={`arena-market-card group relative rounded-lg border transition-all duration-200 overflow-hidden ${
        hasPredicted 
          ? 'border-feedgod-primary/20' 
          : 'border-[#3a3b35] hover:border-[#4a4b45]'
      }`}
      style={{ backgroundColor: '#252620' }}
    >
      {/* Header */}
      <div className="relative p-3">
        {/* Gradient background with opacity */}
        <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.color} opacity-10`} />
        <div className="relative flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">{market.title}</h3>
            <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{market.description}</p>
          </div>
        </div>
      </div>
      
      {/* Value Display */}
      <div className="px-3 py-2.5 border-b border-[#3a3b35]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Current Value</p>
            <p className={`text-lg font-semibold text-white transition-all duration-500 ${showValue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              {formatValue(market.currentValue, market.unit)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-600 mb-0.5">24h Change</p>
            <div className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-medium">{priceChange >= 0 ? '+' : ''}{priceChangePercent}%</span>
            </div>
          </div>
        </div>
        
        {/* Source */}
        <p className="text-[9px] text-gray-600 mt-1.5">
          Source: {market.source}
        </p>
      </div>
      
      {/* Community Prediction Bar */}
      <div className="px-3 py-2.5 border-b border-[#3a3b35]">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
          <span className="flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {market.upPredictors + market.downPredictors} predictors
          </span>
          <span>{totalPoints.toLocaleString('en-US')} pts</span>
        </div>
        
        {/* Progress Bar */}
        <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1D1E19]">
          <div 
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${upPercent}%` }}
          />
          <div 
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${downPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-1 text-[10px]">
          <span className="text-green-400 font-medium">{upPercent}% UP</span>
          <span className="text-red-400 font-medium">{downPercent}% DOWN</span>
        </div>
      </div>
      
      {/* Prediction Buttons or Status */}
      <div className="p-3">
        {hasPredicted ? (
          <div className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs ${
            existingPrediction!.direction === 'up' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <Check className={`w-3 h-3 ${existingPrediction!.direction === 'up' ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`font-medium ${existingPrediction!.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              Bet {existingPrediction!.amountWagered} USDC on {existingPrediction!.direction.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={() => handlePredict('up')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 hover:border-green-500/40 rounded-md transition-all group/btn"
            >
              <TrendingUp className="w-3.5 h-3.5 text-green-400 group-hover/btn:scale-110 transition-transform" />
              <span className="font-semibold text-xs text-green-400">UP</span>
            </button>
            <button
              onClick={() => handlePredict('down')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 rounded-md transition-all group/btn"
            >
              <TrendingDown className="w-3.5 h-3.5 text-red-400 group-hover/btn:scale-110 transition-transform" />
              <span className="font-semibold text-xs text-red-400">DOWN</span>
            </button>
          </div>
        )}
        
        {/* Time Remaining */}
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Resolves in {timeRemaining}</span>
        </div>
        
        {/* Payout Info */}
        <p className="text-[9px] text-gray-600 text-center mt-1">
          Up to {(market.payoutMultiplier && !isNaN(market.payoutMultiplier) ? market.payoutMultiplier : 2.0).toFixed(1)}x payout
        </p>
      </div>
    </div>
  )
}
