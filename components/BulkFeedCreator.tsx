'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { playPickupSound } from '@/lib/sound-utils'

interface BulkFeedCreatorProps {
  isOpen: boolean
  onClose: () => void
  onFeedsGenerated: (feeds: FeedConfig[]) => void
}

export default function BulkFeedCreator({ isOpen, onClose, onFeedsGenerated }: BulkFeedCreatorProps) {
  const [count, setCount] = useState<number>(10)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState<string>('')

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (count < 1 || count > 1000) {
      alert('Please enter a count between 1 and 1000')
      return
    }

    setIsGenerating(true)
    playPickupSound()

    try {
      const feeds: FeedConfig[] = []

      if (prompt.trim()) {
        // Generate feeds from AI prompt
        // Parse the prompt to extract feed information
        const lines = prompt.split('\n').filter(line => line.trim())
        
        for (let i = 0; i < Math.min(count, lines.length); i++) {
          const line = lines[i].trim()
          // Extract symbol from line (e.g., "BTC/USD", "ETH/USD", etc.)
          const symbolMatch = line.match(/([A-Z]{2,10}\/[A-Z]{2,10})/i)
          const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : `FEED${i + 1}/USD`
          
          feeds.push({
            name: `${symbol} Feed`,
            symbol: symbol,
            dataSources: [
              { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
              { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
              { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
            ],
            aggregator: { type: 'median' },
            updateInterval: 60,
            decimals: 8,
            blockchain: 'solana',
            network: 'mainnet',
            enabled: true,
          })
        }

        // If we need more feeds, generate them with variations
        while (feeds.length < count) {
          const index = feeds.length
          feeds.push({
            name: `Feed ${index + 1}`,
            symbol: `TOKEN${index + 1}/USD`,
            dataSources: [
              { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
              { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
              { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
            ],
            aggregator: { type: 'median' },
            updateInterval: 60,
            decimals: 8,
            blockchain: 'solana',
            network: 'mainnet',
            enabled: true,
          })
        }
      } else if (template.trim()) {
        // Generate feeds from template
        // Template format: {symbol}, {name}, etc.
        const templateLines = template.split('\n').filter(line => line.trim())
        
        for (let i = 0; i < count; i++) {
          const templateLine = templateLines[i % templateLines.length]
          const parts = templateLine.split(',').map(p => p.trim())
          const symbol = parts[0] || `FEED${i + 1}/USD`
          const name = parts[1] || `${symbol} Feed`
          
          feeds.push({
            name: name.replace('{i}', (i + 1).toString()),
            symbol: symbol.replace('{i}', (i + 1).toString()),
            dataSources: [
              { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
              { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
              { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
            ],
            aggregator: { type: 'median' },
            updateInterval: 60,
            decimals: 8,
            blockchain: 'solana',
            network: 'mainnet',
            enabled: true,
          })
        }
      } else {
        // Generate generic feeds
        for (let i = 0; i < count; i++) {
          feeds.push({
            name: `Feed ${i + 1}`,
            symbol: `TOKEN${i + 1}/USD`,
            dataSources: [
              { id: 'coingecko', name: 'CoinGecko', type: 'api', enabled: true, weight: 1 },
              { id: 'binance', name: 'Binance', type: 'api', enabled: true, weight: 1 },
              { id: 'coinbase', name: 'Coinbase', type: 'api', enabled: true, weight: 1 },
            ],
            aggregator: { type: 'median' },
            updateInterval: 60,
            decimals: 8,
            blockchain: 'solana',
            network: 'mainnet',
            enabled: true,
          })
        }
      }

      onFeedsGenerated(feeds)
      onClose()
    } catch (error) {
      console.error('Error generating bulk feeds:', error)
      alert('Error generating feeds. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-pink-200 dark:border-feedgod-dark-accent p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-feedgod-dark dark:text-feedgod-neon-cyan">
            Create Bulk Feeds
          </h2>
          <button
            onClick={onClose}
            className="text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 hover:text-feedgod-primary dark:hover:text-feedgod-neon-pink star-glow-on-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              Number of Feeds (1-1000)
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              AI Prompt (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt describing the feeds you want, one per line. Example:&#10;BTC/USD&#10;ETH/USD&#10;SOL/USD"
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink h-32"
            />
            <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
              Enter one feed symbol per line. The AI will generate feeds based on your prompt.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan mb-2">
              Template (Optional)
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Enter a template, one per line. Use {i} for index. Example:&#10;BTC/USD, Bitcoin Feed&#10;ETH/USD, Ethereum Feed"
              className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-feedgod-dark dark:text-feedgod-neon-cyan focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink h-32"
            />
            <p className="text-xs text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 mt-1">
              Format: symbol, name (one per line). Use {'{i}'} for index numbers.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent hover:bg-feedgod-pink-200 dark:hover:bg-feedgod-dark-accent/80 rounded-lg text-feedgod-dark dark:text-feedgod-neon-cyan text-sm font-medium transition-colors star-glow-on-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-feedgod-primary hover:bg-feedgod-secondary rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 star-glow-on-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Generate {count} Feed{count !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

