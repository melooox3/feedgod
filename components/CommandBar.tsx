'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  Search, 
  Loader2, 
  X, 
  Sparkles, 
  ArrowRight,
  BarChart3,
  Target,
  Cloud,
  Trophy,
  Users,
  Globe,
  Brain,
  Code,
  Dices,
  Key,
  TrendingUp,
  Landmark,
  LucideIcon
} from 'lucide-react'
import { FeedConfig } from '@/types/feed'
import { BuilderType, FunctionConfig, VRFConfig, SecretConfig, ParsedPrompt } from '@/types/switchboard'
import { generateFromPrompt } from '@/lib/ai-assistant-extended'
import { detectIntent, EXAMPLE_PROMPTS, DetectedIntent, ModuleIconName } from '@/lib/prompt-router'
import { playPickupSound } from '@/lib/sound-utils'
import { logger } from '@/lib/logger'

// Module icon mapping
const MODULE_ICON_MAP: Record<ModuleIconName, LucideIcon> = {
  BarChart3,
  Target,
  Cloud,
  Trophy,
  Users,
  Globe,
  Brain,
  Code,
  Dices,
  Key,
  TrendingUp,
  Landmark,
}

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

const HOMEPAGE_PLACEHOLDER = "Any data. Just describe it."

const getPlaceholder = (tab?: BuilderType) => {
  switch (tab) {
    case 'feed':
      return "Create a price feed... (e.g., HYPE/USDT, CHILLCOCK/SOL)"
    case 'function':
      return "Create a function... (e.g., 'arbitrage bot', 'web scraper')"
    case 'vrf':
      return "Create VRF... (e.g., 'NFT mint randomizer')"
    case 'secret':
      return "Create a secret... (e.g., 'CoinGecko API key')"
    case 'prediction':
      return "Search prediction markets... (e.g., 'trump election')"
    case 'weather':
      return "Search cities... (e.g., 'tokyo', 'new york')"
    case 'sports':
      return "Search sports... (e.g., 'lakers', 'premier league')"
    case 'social':
      return "Enter username... (e.g., '@elonmusk')"
    case 'custom-api':
      return "Enter API URL..."
    case 'ai-judge':
      return "Enter your question..."
    default:
      return "Any data. Just describe it."
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
        return 'Generating feed...'
      case 'function':
        return 'Creating function...'
      case 'vrf':
        return 'Setting up VRF...'
      case 'secret':
        return 'Creating secret...'
      default:
        return 'Processing...'
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
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
      if (isHomepage && onModuleNavigate) {
        const intent = detectIntent(query)
        await new Promise(resolve => setTimeout(resolve, 300))
        onModuleNavigate(intent.module, intent.parsed)
        setInput('')
        setIsLoading(false)
        return
      }
      
      if (query.startsWith('/search ') || query.startsWith('search ')) {
        const searchQuery = query.replace(/^\/?search\s+/, '')
        if (onSearch) {
          onSearch(searchQuery)
        }
      } else {
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
    <div className="relative animate-fade-in animate-delay-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center group">
          {/* Search icon */}
          <div className="absolute left-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-feedgod-primary" />
            ) : (
              <Search className="w-4 h-4 text-gray-500 group-focus-within:text-gray-400 transition-colors" />
            )}
          </div>
          
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={finalPlaceholder}
            className="w-full bg-[#252620] border border-[#3a3b35] rounded-xl pl-11 pr-24 py-3.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-feedgod-primary/50 focus:ring-2 focus:ring-feedgod-primary/10 transition-all duration-150 input-inset disabled:opacity-60"
            disabled={isLoading}
          />
          
          {/* Detected intent badge */}
          {detectedIntent && input.length >= 2 && !isLoading && (
            <div className="absolute right-20 flex items-center gap-1.5 px-2 py-1 bg-feedgod-primary/10 border border-feedgod-primary/20 rounded-md">
              {(() => {
                const DetectedIcon = MODULE_ICON_MAP[detectedIntent.iconName]
                return <DetectedIcon className="w-3.5 h-3.5 text-feedgod-primary" />
              })()}
              <span className="text-xs font-medium text-feedgod-primary">
                {detectedIntent.label}
              </span>
            </div>
          )}
          
          {/* Clear button */}
          {input && !isLoading && !detectedIntent && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-16 p-1 hover:bg-[#3a3b35] rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          )}
          
          {/* Keyboard shortcut hint */}
          {!isLoading && (
            <div className="absolute right-3 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-[#1D1E19] border border-[#3a3b35] rounded">
                <span>⌘</span>K
              </kbd>
            </div>
          )}
        </div>
      </form>
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#252620] border border-[#3a3b35] rounded-lg shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin text-feedgod-primary" />
          <span className="text-sm text-gray-300">
            {getLoadingMessage()}
          </span>
        </div>
      )}
      
      {/* Example pills */}
      {(showExamples || isHomepage) && !isLoading && (
        <div className="mt-5 flex flex-wrap gap-2 justify-center animate-fade-in animate-delay-3">
          {EXAMPLE_PROMPTS.map((example, i) => {
            const ExampleIcon = MODULE_ICON_MAP[example.iconName]
            return (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-[#ff0d6e]/10 border border-[#3a3b35] hover:border-[#ff0d6e] rounded-full text-xs text-gray-400 hover:text-white transition-all duration-150"
              >
                <ExampleIcon className="w-3 h-3 text-gray-500 group-hover:text-[#ff0d6e] transition-colors" />
                <span>{example.text}</span>
                <ArrowRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#ff0d6e]" />
              </button>
            )
          })}
        </div>
      )}
      
      {/* Hint text */}
      {isHomepage && isFocused && input.length === 0 && (
        <div className="mt-3 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5 animate-fade-in">
          <Sparkles className="w-3 h-3" />
          <span>Smart routing auto-detects your intent</span>
        </div>
      )}
    </div>
  )
}
