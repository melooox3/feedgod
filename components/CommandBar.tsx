'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  const getLoadingMessage = () => {
    switch (activeTab) {
      case 'feed':
        return 'Generating your feed...'
      case 'function':
        return 'Creating your function...'
      case 'vrf':
        return 'Setting up your VRF...'
      case 'secret':
        return 'Creating your secret...'
      default:
        return 'Generating...'
    }
  }


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
    // Don't clear input immediately - keep it visible during loading
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
      setInput('') // Clear input after loading completes
    }
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center gap-2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink" />
            ) : (
              <Search className="w-4 h-4 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={finalPlaceholder}
            className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg px-10 py-2.5 text-feedgod-dark dark:text-feedgod-neon-cyan placeholder-feedgod-pink-400 dark:placeholder-feedgod-neon-cyan/50 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink focus:border-feedgod-primary dark:focus:border-feedgod-neon-pink transition-all star-glow-on-hover disabled:opacity-70"
            disabled={isLoading}
          />
          {input && !isLoading && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-3 p-0.5 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded transition-colors star-glow-on-hover"
            >
              <X className="w-3.5 h-3.5 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70" />
            </button>
          )}
          {!isLoading && (
            <div className="absolute right-3 flex items-center gap-2 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </div>
          )}
        </div>
      </form>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 flex items-center gap-2 px-3 py-2 bg-feedgod-pink-100 dark:bg-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-lg shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink flex-shrink-0" />
          <span className="text-xs font-medium text-feedgod-dark dark:text-feedgod-neon-cyan">
            {getLoadingMessage()}
          </span>
        </div>
      )}
    </div>
  )
}




