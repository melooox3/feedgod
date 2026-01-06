'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Bell,
  MoreVertical,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { 
  MonitoredOracle, 
  formatOracleValue, 
  getStatusBg,
  getTimeSinceUpdate,
  getTypeIcon 
} from '@/lib/oracle-monitor'
import OracleSparkline from './OracleSparkline'
import { playPickupSound } from '@/lib/sound-utils'

// Chain logos
const CHAIN_LOGOS: Record<string, string> = {
  solana: '/solana.png',
  ethereum: '/ethereum.png',
  monad: '/monad.png',
}

interface LiveOracleCardProps {
  oracle: MonitoredOracle
  onRefresh?: () => void
  onSetAlert?: () => void
  compact?: boolean
}

export default function LiveOracleCard({ 
  oracle, 
  onRefresh,
  onSetAlert,
  compact = false 
}: LiveOracleCardProps) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  const handleCopyKey = () => {
    navigator.clipboard.writeText(oracle.publicKey)
    setCopied(true)
    playPickupSound()
    setTimeout(() => setCopied(false), 2000)
  }
  
  const formattedValue = formatOracleValue(oracle.currentValue, oracle.type, oracle.symbol)
  const hasAlerts = oracle.alerts.filter(a => !a.acknowledged).length > 0
  
  // Change indicator
  const ChangeIcon = oracle.changeDirection === 'up' ? TrendingUp : 
                     oracle.changeDirection === 'down' ? TrendingDown : Minus
  const changeColor = oracle.changeDirection === 'up' ? 'text-emerald-500' : 
                      oracle.changeDirection === 'down' ? 'text-red-500' : 'text-gray-400'

  if (compact) {
    return (
      <div className="bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-4 backdrop-blur-sm hover:border-feedgod-primary/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTypeIcon(oracle.type)}</span>
            <span className="font-medium text-feedgod-dark dark:text-white text-sm truncate">
              {oracle.symbol}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusBg(oracle.status)} animate-pulse`} />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xl font-bold text-feedgod-dark dark:text-white">
            {formattedValue}
          </span>
          <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
            <ChangeIcon className="w-3 h-3" />
            <span>{oracle.change24h >= 0 ? '+' : ''}{oracle.change24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-white/60 dark:bg-feedgod-dark-secondary/80 rounded-xl border backdrop-blur-sm transition-all hover:shadow-lg ${
      oracle.status === 'error' ? 'border-red-300 dark:border-red-700/50' :
      oracle.status === 'stale' ? 'border-amber-300 dark:border-amber-700/50' :
      'border-feedgod-pink-200 dark:border-feedgod-dark-accent hover:border-feedgod-primary/50'
    }`}>
      {/* Alert badge */}
      {hasAlerts && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">
            {oracle.alerts.filter(a => !a.acknowledged).length}
          </span>
        </div>
      )}
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              oracle.type === 'feed' ? 'bg-blue-100 dark:bg-blue-900/30' :
              oracle.type === 'prediction' ? 'bg-purple-100 dark:bg-purple-900/30' :
              oracle.type === 'weather' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
              oracle.type === 'social' ? 'bg-pink-100 dark:bg-pink-900/30' :
              'bg-feedgod-pink-100 dark:bg-feedgod-dark-accent'
            }`}>
              <span className="text-xl">{getTypeIcon(oracle.type)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-feedgod-dark dark:text-white text-sm">
                {oracle.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
                <img 
                  src={CHAIN_LOGOS[oracle.blockchain]} 
                  alt={oracle.blockchain}
                  className="w-3.5 h-3.5"
                />
                <span className="capitalize">{oracle.blockchain}</span>
                <span className="opacity-50">•</span>
                <span>{oracle.network}</span>
              </div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusBg(oracle.status)} ${oracle.status === 'healthy' ? 'animate-pulse' : ''}`} />
            
            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-feedgod-pink-400" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-feedgod-dark-secondary rounded-lg shadow-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent z-10">
                  <button
                    onClick={() => { onRefresh?.(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-feedgod-dark dark:text-white hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => { onSetAlert?.(); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-feedgod-dark dark:text-white hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Set Alert
                  </button>
                  <a
                    href={`https://solscan.io/account/${oracle.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-3 py-2 text-left text-sm text-feedgod-dark dark:text-white hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Solscan
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Value & Sparkline */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-3xl font-bold text-feedgod-dark dark:text-white">
              {formattedValue}
            </p>
            <div className={`flex items-center gap-1 mt-1 ${changeColor}`}>
              <ChangeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {oracle.change24h >= 0 ? '+' : ''}{oracle.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-feedgod-pink-400 dark:text-feedgod-neon-cyan/50 ml-1">
                24h
              </span>
            </div>
          </div>
          
          <OracleSparkline 
            data={oracle.history.slice(-48)} // Last 4 hours
            width={100}
            height={40}
          />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-feedgod-pink-100 dark:border-feedgod-dark-accent">
          <div className="flex items-center gap-1 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70">
            <Clock className="w-3 h-3" />
            <span>{getTimeSinceUpdate(oracle.lastUpdate)}</span>
          </div>
          
          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1 px-2 py-1 text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:text-feedgod-primary hover:bg-feedgod-pink-50 dark:hover:bg-feedgod-dark-accent rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="font-mono">{oracle.publicKey.slice(0, 4)}...{oracle.publicKey.slice(-4)}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Alert banner (if has unacknowledged alerts) */}
        {hasAlerts && (
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{oracle.alerts[0].message}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Source badge */}
      {oracle.source && (
        <div className="px-5 py-2 bg-feedgod-pink-50/50 dark:bg-feedgod-dark-accent/50 border-t border-feedgod-pink-100 dark:border-feedgod-dark-accent text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/60 rounded-b-xl">
          Source: {oracle.source}
        </div>
      )}
    </div>
  )
}

