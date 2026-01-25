'use client'

import { useState } from 'react'
import { 
  X, 
  Copy, 
  ExternalLink, 
  Clock, 
  Calendar, 
  User, 
  Database,
  Code,
  Dice6,
  Target,
  Cloud,
  CheckCircle,
  Zap
} from 'lucide-react'
import { Oracle, OracleType } from '@/types/oracle'
import { formatOracleValue, getOracleTypeLabel, getOracleTypeColor } from '@/lib/explore-api'
import { playPickupSound } from '@/lib/sound-utils'

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

interface OracleDetailModalProps {
  oracle: Oracle | null
  isOpen: boolean
  onClose: () => void
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

// Format date nicely
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate integration code snippets
function generateCodeSnippet(oracle: Oracle, language: 'javascript' | 'rust' | 'python'): string {
  const snippets = {
    javascript: `// Install: npm install @switchboard-xyz/on-demand

import { PublicKey } from "@solana/web3.js";
import { PullFeed } from "@switchboard-xyz/on-demand";

const feedPubkey = new PublicKey("${oracle.publicKey}");
const feed = new PullFeed(feedPubkey);

// Get the current value
const [value, slot] = await feed.fetchUpdateAndGetResult();
console.log("${oracle.symbol} value:", value.toString());`,

    rust: `// Add to Cargo.toml:
// switchboard-on-demand = "0.1"

use switchboard_on_demand::PullFeed;
use solana_sdk::pubkey::Pubkey;

let feed_pubkey = Pubkey::from_str("${oracle.publicKey}").unwrap();
let feed = PullFeed::new(feed_pubkey);

// Fetch the latest value
let result = feed.fetch_update().await?;
println!("${oracle.symbol} value: {}", result.value);`,

    python: `# Install: pip install switchboard-py

from switchboard_py import PullFeed
from solana.publickey import PublicKey

feed_pubkey = PublicKey("${oracle.publicKey}")
feed = PullFeed(feed_pubkey)

# Get current value
result = await feed.fetch_update()
print(f"${oracle.symbol} value: {result.value}")`,
  }
  
  return snippets[language]
}

export default function OracleDetailModal({ oracle, isOpen, onClose }: OracleDetailModalProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'javascript' | 'rust' | 'python'>('javascript')
  const [copied, setCopied] = useState<string | null>(null)
  
  if (!isOpen || !oracle) return null
  
  const Icon = getOracleIcon(oracle.type)
  const typeColor = getOracleTypeColor(oracle.type)
  
  const handleCopy = (text: string, id: string) => {
    playPickupSound()
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      playPickupSound()
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded-2xl border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border-b border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                oracle.type === 'feed' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                oracle.type === 'prediction' ? 'bg-gradient-to-br from-feedgod-secondary to-feedgod-primary' :
                oracle.type === 'vrf' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                oracle.type === 'weather' ? 'bg-gradient-to-br from-sky-400 to-sky-600' :
                'bg-gradient-to-br from-pink-400 to-pink-600'
              }`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">
                    {oracle.name}
                  </h2>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeColor}`}>
                    {getOracleTypeLabel(oracle.type)}
                  </span>
                </div>
                <p className="text-sm font-mono text-feedgod-primary dark:text-feedgod-primary ">
                  {oracle.symbol}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => { playPickupSound(); onClose(); }}
              className="p-2 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Current Value - Hero */}
          <div className="bg-gradient-to-br from-feedgod-primary dark:text-feedgod-primary/10 to-feedgod-primary/10 rounded-xl p-6 border border-feedgod-primary dark:text-feedgod-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Value</p>
                <p className="text-4xl font-bold text-white font-mono">
                  {formatOracleValue(oracle)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium">Live</span>
                </div>
                <p className="text-xs text-gray-500">
                  Updated {formatDate(oracle.lastUpdate)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {oracle.description && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300">
                {oracle.description}
              </p>
            </div>
          )}
          
          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs">Network</span>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src={CHAIN_LOGOS[oracle.network] || '/solana.png'}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
                <p className="text-sm font-medium text-white capitalize">
                  {oracle.network.replace('-', ' ')}
                </p>
              </div>
            </div>
            
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Update Interval</span>
              </div>
              <p className="text-sm font-medium text-white">
                {oracle.updateInterval === 0 ? 'On-demand' :
                 oracle.updateInterval && oracle.updateInterval < 60 ? `${oracle.updateInterval}s` :
                 oracle.updateInterval && oracle.updateInterval < 3600 ? `${oracle.updateInterval / 60}m` :
                 oracle.updateInterval ? `${oracle.updateInterval / 3600}h` : 'N/A'}
              </p>
            </div>
            
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-xs">Sources</span>
              </div>
              <p className="text-sm font-medium text-white">
                {oracle.sources.join(', ')}
              </p>
            </div>
            
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Created</span>
              </div>
              <p className="text-sm font-medium text-white">
                {new Date(oracle.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <span className="text-xs">Decimals</span>
              </div>
              <p className="text-sm font-medium text-white">
                {oracle.decimals ?? 'N/A'}
              </p>
            </div>
            
            <div className="bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs">Creator</span>
              </div>
              <p className="text-sm font-medium text-white font-mono truncate" title={oracle.creator}>
                {oracle.creator.slice(0, 8)}...{oracle.creator.slice(-4)}
              </p>
            </div>
          </div>
          
          {/* Public Key */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Public Key</h3>
            <div className="flex items-center gap-2 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/50 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono text-gray-300 break-all">
                {oracle.publicKey}
              </code>
              <button
                onClick={() => handleCopy(oracle.publicKey, 'pubkey')}
                className="p-2 hover:bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded transition-colors flex-shrink-0"
              >
                {copied === 'pubkey' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          {/* Integration Code */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Integration Code</h3>
            
            {/* Language tabs */}
            <div className="flex gap-2 mb-3">
              {(['javascript', 'rust', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { playPickupSound(); setActiveCodeTab(lang); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeCodeTab === lang
                      ? 'bg-feedgod-primary dark:text-feedgod-primary text-white'
                      : 'bg-feedgod-dark-accent text-gray-400 hover:bg-feedgod-dark-accent/80'
                  }`}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Code block */}
            <div className="relative">
              <div className="bg-feedgod-dark-secondary dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {generateCodeSnippet(oracle, activeCodeTab)}
                </pre>
              </div>
              <button
                onClick={() => handleCopy(generateCodeSnippet(oracle, activeCodeTab), 'code')}
                className="absolute top-3 right-3 p-2 bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary/80 hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent rounded transition-colors"
              >
                {copied === 'code' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <a
              href={`https://explorer.solana.com/address/${oracle.publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/80 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on Explorer
            </a>
            <button
              onClick={() => { playPickupSound(); onClose(); }}
              className="flex-1 px-4 py-3 gradient-bg hover:opacity-90 rounded-lg text-white font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

