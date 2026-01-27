'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Crown, Flame, TrendingUp } from 'lucide-react'
import { getLeaderboard, getArenaUser, formatSwtch, formatPoints } from '@/lib/arena/arena-storage'
import { LeaderboardEntry } from '@/types/arena'

type TimeFilter = 'weekly' | 'monthly' | 'alltime'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userId, setUserId] = useState<string>('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('alltime')

  useEffect(() => {
    const user = getArenaUser()
    setUserId(user.id)
    
    const loadLeaderboard = () => {
      setLeaderboard(getLeaderboard())
    }
    
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return <span className="w-4 text-center text-gray-600 text-xs font-medium">{rank}</span>
    }
  }

  const getRankBgClass = (rank: number, isUser: boolean) => {
    if (isUser) return 'bg-feedgod-primary/10 border-feedgod-primary/30'
    switch (rank) {
      case 1: return 'bg-yellow-500/10 border-yellow-500/20'
      case 2: return 'bg-gray-400/10 border-gray-400/20'
      case 3: return 'bg-amber-600/10 border-amber-600/20'
      default: return 'bg-[#1D1E19] border-[#3a3b35]'
    }
  }

  return (
    <div className="bg-[#252620] rounded-lg border border-[#3a3b35] overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#3a3b35]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-white text-sm">Leaderboard</h3>
        </div>
        
        {/* Time Filter */}
        <div className="flex gap-1">
          {(['weekly', 'monthly', 'alltime'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-feedgod-primary text-white'
                  : 'bg-[#1D1E19] text-gray-500 hover:text-gray-300'
              }`}
            >
              {filter === 'alltime' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Leaderboard List */}
      <div className="max-h-[350px] overflow-y-auto">
        {leaderboard.slice(0, 20).map((entry) => {
          const isUser = entry.id === userId
          
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-3 py-2 border-b border-[#3a3b35]/50 last:border-b-0 ${
                getRankBgClass(entry.rank, isUser)
              } ${isUser ? 'border-l-2' : ''}`}
            >
              {/* Rank */}
              <div className="w-6 flex justify-center">
                {getRankIcon(entry.rank)}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isUser ? 'text-feedgod-primary' : 'text-gray-200'}`}>
                  {entry.nickname}
                  {isUser && <span className="text-[10px] ml-1 text-gray-500">(You)</span>}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />
                    {entry.winRate}%
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-orange-500/70" />
                    {entry.longestStreak}
                  </span>
                </div>
              </div>
              
              {/* Points */}
              <div className="text-right">
                <p className="font-semibold text-xs text-white">{formatPoints(entry.points)}</p>
                <p className="text-[9px] text-gray-600">pts</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
