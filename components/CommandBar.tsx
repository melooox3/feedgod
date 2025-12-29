'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, Loader2, X } from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { BuilderType } from '@/types/switchboard'
import { generateFromPrompt } from '@/lib/ai-assistant-extended'

interface CommandBarProps {
  onFeedGenerated?: (config: FeedConfig) => void
  onFunctionGenerated?: (config: any) => void
  onVRFGenerated?: (config: any) => void
  onSecretGenerated?: (config: any) => void
  onSearch?: (query: string) => void
  placeholder?: string
  activeTab?: BuilderType
}

const getPlaceholder = (tab?: BuilderType) => {
  switch (tab) {
    case 'feed':
      return "Create something... (e.g., 'MON/USDT feed', 'BTC price with 30s updates', 'ETH/USD')"
    case 'function':
      return "Create something... (e.g., 'arbitrage bot', 'web scraper', 'ML prediction')"
    case 'vrf':
      return "Create something... (e.g., 'NFT mint randomizer', 'random number 1 to 100')"
    case 'secret':
      return "Create something... (e.g., 'CoinGecko API key', 'private key storage')"
    default:
      return "Create something..."
  }
}

export default function CommandBar({ 
  onFeedGenerated, 
  onFunctionGenerated,
  onVRFGenerated,
  onSecretGenerated,
  onSearch, 
  placeholder,
  activeTab = 'feed'
}: CommandBarProps) {
  const finalPlaceholder = placeholder || getPlaceholder(activeTab)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const getSuggestions = () => {
    switch (activeTab) {
      case 'feed':
        return [
          "Create BTC/USD feed",
          "SOL/USD with 1 minute updates",
          "ETH price using CoinGecko and Binance",
          "Build a weighted aggregator feed",
        ]
      case 'function':
        return [
          "Create an arbitrage bot",
          "Build a web scraper function",
          "Create a ML prediction function",
          "Build a function that runs every 5 minutes",
        ]
      case 'vrf':
        return [
          "Create a VRF for NFT mints",
          "Build a random number generator from 1 to 100",
          "Create a gaming randomizer",
          "Build a lottery VRF",
        ]
      case 'secret':
        return [
          "Create a CoinGecko API key",
          "Store a private key",
          "Create a webhook URL secret",
          "Store a database connection",
        ]
      default:
        return []
    }
  }

  const suggestions = getSuggestions()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape to clear
      if (e.key === 'Escape') {
        setInput('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Check if it's a search query (starts with /search or just a symbol)
      if (query.startsWith('/search ') || query.startsWith('search ')) {
        const searchQuery = query.replace(/^\/?search\s+/, '')
        if (onSearch) {
          onSearch(searchQuery)
        }
      } else {
        // Treat as AI prompt based on active tab
        if (!activeTab) return
        
        const config = await generateFromPrompt(query, activeTab)
        
        switch (activeTab) {
          case 'feed':
            if (onFeedGenerated) onFeedGenerated(config as FeedConfig)
            break
          case 'function':
            if (onFunctionGenerated) onFunctionGenerated(config)
            break
          case 'vrf':
            if (onVRFGenerated) onVRFGenerated(config)
            break
          case 'secret':
            if (onSecretGenerated) onSecretGenerated(config)
            break
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center gap-2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-feedgod-primary" />
            ) : (
              <Search className="w-5 h-5 text-feedgod-pink-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onFocus={() => setShowSuggestions(input.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={finalPlaceholder}
            className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-12 py-3 text-feedgod-dark dark:text-feedgod-neon-cyan placeholder-feedgod-pink-400 dark:placeholder-feedgod-neon-cyan/50 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink focus:border-feedgod-primary dark:focus:border-feedgod-neon-pink transition-all star-glow-on-hover"
            disabled={isLoading}
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-4 p-1 hover:bg-feedgod-pink-100 rounded transition-colors star-glow-on-hover"
            >
              <X className="w-4 h-4 text-feedgod-pink-400" />
            </button>
          )}
          <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-feedgod-pink-500 bg-feedgod-pink-50 border border-feedgod-pink-200 rounded">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </div>
      </form>

            {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-feedgod-pink-100 border border-feedgod-pink-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {suggestions
            .filter(s => s.toLowerCase().includes(input.toLowerCase()))
            .map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(suggestion)
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
                className="w-full text-left px-4 py-3 hover:bg-feedgod-pink-200 transition-colors flex items-center gap-2 star-glow-on-hover"
              >
                <Sparkles className="w-4 h-4 text-feedgod-primary flex-shrink-0" />
                <span className="text-sm text-feedgod-dark">{suggestion}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}




