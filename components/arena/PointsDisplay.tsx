'use client'

import { useState, useEffect } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { getUserStats, formatSwtch, formatPoints } from '@/lib/arena/arena-storage'

interface PointsDisplayProps {
  compact?: boolean
  showStats?: boolean
}

export default function PointsDisplay({ compact = false, showStats = false }: PointsDisplayProps) {
  const [stats, setStats] = useState({
    swtchBalance: 0,
    points: 0,
    totalVolume: 0,
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    currentStreak: 0,
    longestStreak: 0,
    rank: 0,
  })

  useEffect(() => {
    const loadStats = () => {
      const newStats = getUserStats()
      setStats(newStats)
    }
    
    loadStats()
    const interval = setInterval(loadStats, 1000)
    return () => clearInterval(interval)
  }, [])

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="font-medium">
          {formatPoints(stats.points)} pts
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-500">
          #{stats.rank}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-[#252620] rounded-lg border border-[#3a3b35] p-3">
      {/* Points & Rank */}
      <div className="flex items-center justify-between bg-[#1D1E19] rounded-md p-2.5 mb-3">
        <div>
          <p className="text-[10px] text-gray-600">Points</p>
          <p className="text-base font-semibold text-white">{formatPoints(stats.points)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-600">Rank</p>
          <p className="text-base font-semibold text-feedgod-primary">#{stats.rank}</p>
        </div>
      </div>

      {showStats && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-[#1D1E19] rounded-md p-2">
              <p className="text-base font-semibold text-white">{stats.winRate}%</p>
              <p className="text-[9px] text-gray-600 uppercase">Win Rate</p>
            </div>
            <div className="text-center bg-[#1D1E19] rounded-md p-2">
              <div className="flex items-center justify-center gap-0.5">
                <Flame className={`w-3 h-3 ${stats.currentStreak >= 3 ? 'text-orange-500' : 'text-gray-600'}`} />
                <p className="text-base font-semibold text-white">{stats.currentStreak}</p>
              </div>
              <p className="text-[9px] text-gray-600 uppercase">Streak</p>
            </div>
            <div className="text-center bg-[#1D1E19] rounded-md p-2">
              <div className="flex items-center justify-center gap-0.5">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <p className="text-base font-semibold text-white">{stats.longestStreak}</p>
              </div>
              <p className="text-[9px] text-gray-600 uppercase">Best</p>
            </div>
          </div>
          
          {/* Win/Loss Record */}
          <div className="mt-2 flex items-center justify-between text-xs bg-[#1D1E19] rounded-md p-2">
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-medium">{stats.totalWins}W</span>
              <span className="text-gray-600">/</span>
              <span className="text-red-400 font-medium">{stats.totalLosses}L</span>
            </div>
            <div className="text-gray-600 text-[10px]">
              Vol: {formatSwtch(stats.totalVolume)} USDC
            </div>
          </div>
        </>
      )}
    </div>
  )
}
