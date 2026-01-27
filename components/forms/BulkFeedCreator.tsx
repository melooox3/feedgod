'use client'

import { useState } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { AVAILABLE_SOURCES } from '@/lib/hooks/useFeedConfig'
import { playPickupSound } from '@/lib/utils/sound-utils'
import { useToast } from '@/components/shared/Toast'

interface BulkFeedCreatorProps {
  isOpen: boolean
  onClose: () => void
  onFeedsGenerated: (feeds: FeedConfig[]) => void
}

// Default data sources for bulk-created feeds (first 3 from available sources)
const DEFAULT_BULK_SOURCES = AVAILABLE_SOURCES.slice(0, 3).map(s => ({ ...s }))

/** Creates a feed config with the given name and symbol */
function createFeedConfig(name: string, symbol: string): FeedConfig {
  return {
    name,
    symbol,
    dataSources: DEFAULT_BULK_SOURCES.map(s => ({ ...s })),
    aggregator: { type: 'median' },
    updateInterval: 60,
    decimals: 8,
    blockchain: 'solana',
    network: 'mainnet',
    enabled: true,
  }
}

export default function BulkFeedCreator({ isOpen, onClose, onFeedsGenerated }: BulkFeedCreatorProps) {
  const [count, setCount] = useState<number>(10)
  const [template, setTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState<string>('')
  const toast = useToast()

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (count < 1 || count > 1000) {
      toast.warning('Please enter a count between 1 and 1000')
      return
    }

    setIsGenerating(true)
    playPickupSound()

    try {
      const feeds: FeedConfig[] = []

      if (prompt.trim()) {
        // Generate feeds from AI prompt - parse to extract feed symbols
        const lines = prompt.split('\n').filter(line => line.trim())

        for (let i = 0; i < Math.min(count, lines.length); i++) {
          const line = lines[i].trim()
          const symbolMatch = line.match(/([A-Z]{2,10}\/[A-Z]{2,10})/i)
          const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : `FEED${i + 1}/USD`
          feeds.push(createFeedConfig(`${symbol} Feed`, symbol))
        }

        // Fill remaining with generic feeds if needed
        while (feeds.length < count) {
          const index = feeds.length
          feeds.push(createFeedConfig(`Feed ${index + 1}`, `TOKEN${index + 1}/USD`))
        }
      } else if (template.trim()) {
        // Generate feeds from template format: symbol, name
        const templateLines = template.split('\n').filter(line => line.trim())

        for (let i = 0; i < count; i++) {
          const templateLine = templateLines[i % templateLines.length]
          const parts = templateLine.split(',').map(p => p.trim())
          const symbol = (parts[0] || `FEED${i + 1}/USD`).replace('{i}', (i + 1).toString())
          const name = (parts[1] || `${symbol} Feed`).replace('{i}', (i + 1).toString())
          feeds.push(createFeedConfig(name, symbol))
        }
      } else {
        // Generate generic feeds
        for (let i = 0; i < count; i++) {
          feeds.push(createFeedConfig(`Feed ${i + 1}`, `TOKEN${i + 1}/USD`))
        }
      }

      onFeedsGenerated(feeds)
      onClose()
    } catch (error) {
      console.error('Error generating bulk feeds:', error)
      toast.error('Error generating feeds. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary rounded-lg border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white ">
            Create Bulk Feeds
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-feedgod-primary dark:text-feedgod-primary dark:hover:text-feedgod-primary dark:text-feedgod-primary star-glow-on-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white  mb-2">
              Number of Feeds (1-1000)
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-white  focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white  mb-2">
              AI Prompt (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt describing the feeds you want, one per line. Example:&#10;BTC/USD&#10;ETH/USD&#10;SOL/USD"
              className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-white  focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary h-32"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter one feed symbol per line. The AI will generate feeds based on your prompt.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white  mb-2">
              Template (Optional)
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Enter a template, one per line. Use {i} for index. Example:&#10;BTC/USD, Bitcoin Feed&#10;ETH/USD, Ethereum Feed"
              className="w-full bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary dark:bg-feedgod-purple-50 dark:bg-feedgod-dark-secondary border border-feedgod-purple-200 dark:border-feedgod-dark-accent dark:border-feedgod-purple-200 dark:border-feedgod-dark-accent rounded-lg px-4 py-2 text-white  focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:text-feedgod-primary dark:focus:ring-feedgod-primary dark:text-feedgod-primary h-32"
            />
            <p className="text-xs text-gray-400 mt-1">
              Format: symbol, name (one per line). Use {'{i}'} for index numbers.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-feedgod-purple-100 dark:bg-feedgod-dark-accent dark:bg-feedgod-purple-200 dark:border-feedgod-dark-accent hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent dark:hover:bg-feedgod-purple-200 dark:border-feedgod-dark-accent/80 rounded-lg text-white  text-sm font-medium transition-colors star-glow-on-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 gradient-bg hover:opacity-90 rounded-lg text-white text-sm font-medium transition-all flex items-center justify-center gap-2 star-glow-on-hover disabled:opacity-50 disabled:cursor-not-allowed"
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

