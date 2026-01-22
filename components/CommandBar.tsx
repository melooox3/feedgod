'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Loader2, X, Sparkles, ChevronRight } from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { BuilderType, FunctionConfig, VRFConfig, SecretConfig, ParsedPrompt } from '@/types/switchboard'
import { generateFromPrompt } from '@/lib/ai-assistant-extended'
import { detectIntent, EXAMPLE_PROMPTS, DetectedIntent } from '@/lib/prompt-router'
import { playPickupSound } from '@/lib/sound-utils'
import { logger } from '@/lib/logger'

interface CommandBarProps {
  onFeedGenerated?: (config: FeedConfig) => void
  onFunctionGenerated?: (config: FunctionConfig) => void
  onVRFGenerated?: (config: VRFConfig) => void
  onSecretGenerated?: (config: SecretConfig) => void
  onSearch?: (query: string) => void
  onModuleNavigate?: (module: BuilderType, parsed?: ParsedPrompt) => void
  placeholder?: string
  activeTab?: BuilderType
  showExamples?: boolean
  isHomepage?: boolean
}

const HOMEPAGE_PLACEHOLDER = "Try: 'BTC price', 'Trump odds', 'Tokyo weather', '@elonmusk followers'..."

const getPlaceholder = (tab?: BuilderType) => {
  switch (tab) {
    case 'feed':
      return "Create a price feed... (e.g., HYPE/USDT, CHILLCOCK/SOL, FARTCOIN with 30s updates)"
    case 'function':
      return "Create a function... (e.g., 'arbitrage bot', 'web scraper', 'ML prediction')"
    case 'vrf':
      return "Create VRF... (e.g., 'NFT mint randomizer', 'random number 1 to 100')"
    case 'secret':
      return "Create a secret... (e.g., 'CoinGecko API key', 'private key storage')"
    case 'prediction':
      return "Search prediction markets... (e.g., 'trump election', 'bitcoin price', 'sports')"
    case 'weather':
      return "Search cities... (e.g., 'tokyo', 'new york', 'london')"
    case 'sports':
      return "Search sports... (e.g., 'lakers', 'premier league', 'nfl')"
    case 'social':
      return "Enter username... (e.g., '@elonmusk', 'mrbeast', 'pewdiepie')"
    case 'custom-api':
      return "Enter API URL... (e.g., 'https://api.example.com/data')"
    case 'ai-judge':
      return "Enter your question... (e.g., 'Did Taylor Swift release a new album?')"
    default:
      return "What do you want to oracle?"
  }
}

export default function CommandBar({ 
  onFeedGenerated, 
  onFunctionGenerated,
  onVRFGenerated,
  onSecretGenerated,
  onSearch,
  onModuleNavigate,
  placeholder,
  activeTab,
  showExamples = false,
  isHomepage = false
}: CommandBarProps) {
  const finalPlaceholder = placeholder || (isHomepage ? HOMEPAGE_PLACEHOLDER : getPlaceholder(activeTab))
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Detect intent as user types
  const detectedIntent: DetectedIntent | null = useMemo(() => {
    if (!input || input.length < 2 || !isHomepage) return null
    return detectIntent(input)
  }, [input, isHomepage])

  const getLoadingMessage = () => {
    if (detectedIntent) {
      return `Routing to ${detectedIntent.label}...`
    }
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
        return 'Processing...'
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
    setIsLoading(true)
    playPickupSound()

    try {
      // If on homepage with smart routing
      if (isHomepage && onModuleNavigate) {
        const intent = detectIntent(query)
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Navigate to the detected module with parsed data
        onModuleNavigate(intent.module, intent.parsed)
        setInput('')
        setIsLoading(false)
        return
      }
      
      // Check if it's a search query
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
            if (onFunctionGenerated) onFunctionGenerated(config as FunctionConfig)
            break
          case 'vrf':
            if (onVRFGenerated) onVRFGenerated(config as VRFConfig)
            break
          case 'secret':
            if (onSecretGenerated) onSecretGenerated(config as SecretConfig)
            break
        }
      }
    } catch (error) {
      logger.api.error('CommandBar error:', error)
    } finally {
      setIsLoading(false)
      setInput('')
    }
  }

  const handleExampleClick = (example: typeof EXAMPLE_PROMPTS[0]) => {
    playPickupSound()
    setInput(example.text)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center gap-2 pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink" />
            ) : (
              <Search className="w-5 h-5 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={finalPlaceholder}
            className="w-full bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-xl px-12 py-4 text-feedgod-dark dark:text-feedgod-neon-cyan placeholder-feedgod-pink-400 dark:placeholder-feedgod-neon-cyan/50 focus:outline-none focus:ring-2 focus:ring-feedgod-primary dark:focus:ring-feedgod-neon-pink focus:border-feedgod-primary dark:focus:border-feedgod-neon-pink transition-all star-glow-on-hover disabled:opacity-70 text-sm md:text-base"
            disabled={isLoading}
          />
          
          {/* Intent indicator */}
          {detectedIntent && input.length >= 2 && !isLoading && (
            <div className="absolute right-16 flex items-center gap-1.5 px-2.5 py-1 bg-feedgod-primary/10 dark:bg-feedgod-neon-pink/10 border border-feedgod-primary/30 dark:border-feedgod-neon-pink/30 rounded-full">
              <span className="text-sm">{detectedIntent.icon}</span>
              <span className="text-xs font-medium text-feedgod-primary dark:text-feedgod-neon-pink">
                {detectedIntent.label}
              </span>
            </div>
          )}
          
          {input && !isLoading && !detectedIntent && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-12 p-1 hover:bg-feedgod-pink-100 dark:hover:bg-feedgod-dark-accent rounded transition-colors"
            >
              <X className="w-4 h-4 text-feedgod-pink-400 dark:text-feedgod-neon-cyan/70" />
            </button>
          )}
          
          {!isLoading && (
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-feedgod-pink-500 dark:text-feedgod-neon-cyan/70 bg-feedgod-pink-50 dark:bg-feedgod-dark-secondary border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            </div>
          )}
        </div>
      </form>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-3 flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-feedgod-primary/10 to-feedgod-pink-200/20 dark:from-feedgod-neon-pink/10 dark:to-feedgod-dark-accent border border-feedgod-pink-200 dark:border-feedgod-dark-accent rounded-xl shadow-lg">
          <Loader2 className="w-5 h-5 animate-spin text-feedgod-primary dark:text-feedgod-neon-pink flex-shrink-0" />
          <span className="text-sm font-medium text-feedgod-dark dark:text-feedgod-neon-cyan">
            {getLoadingMessage()}
          </span>
          {detectedIntent && (
            <span className="text-lg">{detectedIntent.icon}</span>
          )}
        </div>
      )}
      
      {/* Example prompts (homepage only) */}
      {(showExamples || isHomepage) && !isLoading && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {EXAMPLE_PROMPTS.map((example, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(example)}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-feedgod-dark-secondary/60 hover:bg-feedgod-primary/10 dark:hover:bg-feedgod-neon-pink/10 border border-feedgod-pink-200 dark:border-feedgod-dark-accent hover:border-feedgod-primary/50 dark:hover:border-feedgod-neon-pink/50 rounded-full text-xs text-feedgod-dark dark:text-white transition-all"
            >
              <span>{example.icon}</span>
              <span>{example.text}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-feedgod-primary dark:text-feedgod-neon-pink" />
            </button>
          ))}
        </div>
      )}
      
      {/* Smart routing hint */}
      {isHomepage && isFocused && input.length === 0 && (
        <div className="mt-3 text-center text-xs text-feedgod-pink-400 dark:text-feedgod-neon-cyan/60 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" />
          <span>Smart routing auto-detects what you want</span>
        </div>
      )}
    </div>
  )
}
