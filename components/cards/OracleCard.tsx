'use client'

import { 
  Database, 
  Code, 
  Dice6, 
  Target, 
  Cloud,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Oracle, OracleType } from '@/types/oracle'
import { formatOracleValue, getOracleTypeLabel, getOracleTypeColor } from '@/lib/api/explore-api'
import { playPickupSound } from '@/lib/utils/sound-utils'

// Chain logo mapping
const CHAIN_LOGOS: Record<string, string> = {
  'solana-mainnet': '/solana.png',
  'solana-devnet': '/solana.png',
  'solana-testnet': '/solana.png',
  'ethereum-mainnet': '/ethereum.png',
  'ethereum-testnet': '/ethereum.png',
  'monad-mainnet': '/monad.png',
  'monad-devnet': '/monad.png',
  'monad-testnet': '/monad.png',
}

interface OracleCardProps {
  oracle: Oracle
  onClick: () => void
  isInUse?: boolean
}

// Get icon for oracle type
function getOracleIcon(type: OracleType) {
  switch (type) {
    case 'feed': return Database
    case 'prediction': return Target
    case 'vrf': return Dice6
    case 'weather': return Cloud
    case 'function': return Code
    default: return Database
  }
}

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString()
}

// Truncate public key
function truncateKey(key: string): string {
  if (key.length <= 16) return key
  return `${key.slice(0, 8)}...${key.slice(-6)}`
}

export default function OracleCard({ oracle, onClick, isInUse }: OracleCardProps) {
  const Icon = getOracleIcon(oracle.type)
  const typeColor = getOracleTypeColor(oracle.type)
  
  const handleCopyKey = (e: React.MouseEvent) => {
    e.stopPropagation()
    playPickupSound()
    navigator.clipboard.writeText(oracle.publicKey)
  }
  
  return (
    <div
      onClick={onClick}
      className={`group bg-[#252620]/80 rounded-xl border transition-all duration-300 backdrop-blur-sm cursor-pointer hover:shadow-lg overflow-hidden ${
        isInUse 
          ? 'border-emerald-500/50 hover:border-emerald-400 hover:shadow-emerald-500/10 ring-1 ring-emerald-500/20' 
          : 'border-feedgod-purple-200 dark:border-feedgod-dark-accent hover:border-feedgod-primary hover:shadow-feedgod-primary/10'
      }`}
    >
      {/* In Use Badge */}
      {isInUse && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-b border-emerald-500/30 px-4 py-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">In Use</span>
          </div>
        </div>
      )}
      
      {/* Header with type badge and status */}
      <div className="p-4 pb-3 border-b border-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              oracle.type === 'feed' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
              oracle.type === 'prediction' ? 'bg-gradient-to-br from-feedgod-secondary to-feedgod-primary' :
              oracle.type === 'vrf' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
              oracle.type === 'weather' ? 'bg-gradient-to-br from-sky-400 to-sky-600' :
              'bg-gradient-to-br from-pink-400 to-pink-600'
            }`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColor}`}>
                {getOracleTypeLabel(oracle.type)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {oracle.status === 'active' ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-feedgod-secondary/70">
                <AlertCircle className="w-3 h-3" />
                {oracle.status}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-feedgod-primary dark:text-feedgod-primary dark:group-hover:text-feedgod-primary dark:text-feedgod-primary transition-colors line-clamp-1">
          {oracle.name}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-mono text-feedgod-primary dark:text-feedgod-primary  font-medium">
            {oracle.symbol}
          </span>
          <span className="text-xs text-gray-400 dark:text-feedgod-secondary/70">•</span>
          <div className="flex items-center gap-1">
            <img 
              src={CHAIN_LOGOS[oracle.network] || '/solana.png'}
              alt=""
              className="w-3.5 h-3.5 object-contain"
            />
            <span className="text-xs text-gray-400 /60 capitalize">
              {oracle.network.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        {/* Current value - prominent display */}
        <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-400 /60 mb-1">Current Value</p>
          <p className="text-2xl font-bold text-white font-mono">
            {formatOracleValue(oracle)}
          </p>
        </div>
        
        {/* Meta info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-400 /60">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(oracle.lastUpdate)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-feedgod-secondary/70 /50">
              {oracle.sources.length} source{oracle.sources.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer with public key */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/50 dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/30 rounded-lg px-3 py-2">
          <code className="text-xs font-mono text-gray-400 /70">
            {truncateKey(oracle.publicKey)}
          </code>
          <button
            onClick={handleCopyKey}
            className="p-1.5 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded transition-colors"
            title="Copy public key"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400 /70" />
          </button>
        </div>
      </div>
    </div>
  )
}

