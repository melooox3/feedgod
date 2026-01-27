'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, Flame } from 'lucide-react'
import { Market, PredictionDirection } from '@/types/arena'
import { getTimeRemaining } from '@/lib/arena/arena-api'

interface FeaturedMarketsProps {
  markets: Market[]
  onPredict: (market: Market, direction: PredictionDirection) => void
}

export default function FeaturedMarkets({ markets, onPredict }: FeaturedMarketsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Get top 5 markets by volume (hot markets)
  const featuredMarkets = [...markets]
    .filter(m => m.status === 'open')
    .sort((a, b) => (b.totalUpPoints + b.totalDownPoints) - (a.totalUpPoints + a.totalDownPoints))
    .slice(0, 5)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      return () => container.removeEventListener('scroll', checkScroll)
    }
  }, [featuredMarkets])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (featuredMarkets.length === 0) return null

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-white">Hot Markets</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-md transition-colors ${
              canScrollLeft
                ? 'bg-[#252620] hover:bg-[#2a2b25] text-gray-400'
                : 'bg-[#1D1E19] text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-md transition-colors ${
              canScrollRight
                ? 'bg-[#252620] hover:bg-[#2a2b25] text-gray-400'
                : 'bg-[#1D1E19] text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredMarkets.map((market) => (
          <FeaturedMarketCard
            key={market.id}
            market={market}
            onPredict={onPredict}
          />
        ))}
      </div>
    </div>
  )
}

function FeaturedMarketCard({
  market,
  onPredict,
}: {
  market: Market
  onPredict: (market: Market, direction: PredictionDirection) => void
}) {
  const totalPool = market.totalUpPoints + market.totalDownPoints
  const upPercent = totalPool > 0 ? (market.totalUpPoints / totalPool) * 100 : 50
  const timeRemaining = getTimeRemaining(market.resolveAt)

  return (
    <div className="flex-shrink-0 w-[280px] bg-[#252620] rounded-lg border border-[#3a3b35] p-4 hover:border-feedgod-primary/50 transition-colors">
      {/* Title & Time */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-medium text-white text-sm line-clamp-2">{market.title}</h4>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap">
          <Clock className="w-3 h-3" />
          {timeRemaining}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-0.5">Current</div>
        <div className="text-lg font-semibold text-white">
          {market.unit === '$' ? `$${market.currentValue.toLocaleString()}` : `${market.currentValue.toLocaleString()}${market.unit}`}
        </div>
      </div>

      {/* Pool Distribution Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>UP {upPercent.toFixed(0)}%</span>
          <span>DOWN {(100 - upPercent).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-red-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${upPercent}%` }}
          />
        </div>
      </div>

      {/* Quick Bet Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onPredict(market, 'up')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-medium transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          UP
        </button>
        <button
          onClick={() => onPredict(market, 'down')}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-colors"
        >
          <TrendingDown className="w-3.5 h-3.5" />
          DOWN
        </button>
      </div>
    </div>
  )
}
