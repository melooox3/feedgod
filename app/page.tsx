'use client'

import { useState, useEffect } from 'react'
import { Database, Code, Dice6, Key, ArrowLeft, Plus, Target, TrendingUp, Scale, Terminal, Sparkles, Shield, Cloud, Thermometer, Trophy, Gamepad2, Users, Heart, AtSign, Brain, Zap, Globe, Link2 } from 'lucide-react'
import FeedBuilder from '@/components/FeedBuilder'
import FunctionBuilder from '@/components/FunctionBuilder'
import VRFBuilder from '@/components/VRFBuilder'
import SecretBuilder from '@/components/SecretBuilder'
import PredictionMarketBuilder from '@/components/PredictionMarketBuilder'
import WeatherBuilder from '@/components/WeatherBuilder'
import SportsBuilder from '@/components/SportsBuilder'
import SocialBuilder from '@/components/SocialBuilder'
import AIJudgeBuilder from '@/components/AIJudgeBuilder'
import CustomAPIBuilder from '@/components/CustomAPIBuilder'
import CommandBar from '@/components/CommandBar'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import ModuleCard from '@/components/ModuleCard'
import BulkFeedCreator from '@/components/BulkFeedCreator'
import { FeedConfig } from '@/types/feed'
import { FunctionConfig, VRFConfig, SecretConfig, BuilderType } from '@/types/switchboard'
import { playPickupSound } from '@/lib/sound-utils'

const MODULES = [
  {
    id: 'feed' as BuilderType,
    title: 'Price Feeds',
    description: 'Aggregate real-time price data from multiple sources into reliable on-chain oracles.',
    icon: Database,
    backgroundIcon: TrendingUp,
  },
  {
    id: 'prediction' as BuilderType,
    title: 'Prediction Markets',
    description: 'Create oracles for Polymarket & Kalshi markets. Resolve bets on-chain.',
    icon: Target,
    backgroundIcon: Scale,
  },
  {
    id: 'sports' as BuilderType,
    title: 'Sports',
    description: 'Create oracles for sports match outcomes. Soccer, NBA, NFL, and esports supported.',
    icon: Trophy,
    backgroundIcon: Gamepad2,
  },
  {
    id: 'ai-judge' as BuilderType,
    title: 'AI Judge',
    description: 'Any question → on-chain answer. AI resolves real-world events without custom code.',
    icon: Brain,
    backgroundIcon: Zap,
  },
  {
    id: 'weather' as BuilderType,
    title: 'Weather',
    description: 'Deploy real-time weather data oracles for any city. Power insurance, gaming, and DeFi.',
    icon: Cloud,
    backgroundIcon: Thermometer,
  },
  {
    id: 'custom-api' as BuilderType,
    title: 'Custom API',
    description: 'Turn any JSON API into an on-chain oracle. Click to select values, auto-generate paths.',
    icon: Globe,
    backgroundIcon: Link2,
  },
  {
    id: 'social' as BuilderType,
    title: 'Social Media',
    description: 'Track Twitter, YouTube, and TikTok metrics on-chain. Followers, engagement, viral content.',
    icon: Users,
    backgroundIcon: Heart,
  },
  {
    id: 'function' as BuilderType,
    title: 'Functions',
    description: 'Run custom off-chain computation and push results on-chain with verifiable execution.',
    icon: Code,
    backgroundIcon: Terminal,
  },
  {
    id: 'vrf' as BuilderType,
    title: 'VRF',
    description: 'Generate verifiable random numbers for games, NFTs, and fair selection mechanisms.',
    icon: Dice6,
    backgroundIcon: Sparkles,
  },
  {
    id: 'secret' as BuilderType,
    title: 'Secrets',
    description: 'Securely store and manage API keys and sensitive data for your oracle functions.',
    icon: Key,
    backgroundIcon: Shield,
  },
]

export default function Home() {
  const [activeModule, setActiveModule] = useState<BuilderType | null>(null)
  const [feedConfig, setFeedConfig] = useState<FeedConfig | null>(null)
  const [functionConfig, setFunctionConfig] = useState<FunctionConfig | null>(null)
  const [vrfConfig, setVRFConfig] = useState<VRFConfig | null>(null)
  const [secretConfig, setSecretConfig] = useState<SecretConfig | null>(null)
  const [showBulkCreator, setShowBulkCreator] = useState(false)

  // Load config from sessionStorage if available (from profile page)
  useEffect(() => {
    const loadConfig = sessionStorage.getItem('loadConfig')
    if (loadConfig) {
      try {
        const parsed = JSON.parse(loadConfig)
        const type = parsed.type || 'feed'
        
        if (type === 'feed') {
          setFeedConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveModule('feed')
        } else if (type === 'function') {
          setFunctionConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveModule('function')
        } else if (type === 'vrf') {
          setVRFConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveModule('vrf')
        } else if (type === 'secret') {
          setSecretConfig({
            ...parsed,
            createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
            updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
          })
          setActiveModule('secret')
        }
        
        sessionStorage.removeItem('loadConfig')
      } catch (e) {
        console.error('Error loading config:', e)
      }
    }
  }, [])

  const handleSearch = (query: string) => {
    console.log('Searching for:', query)
    alert(`Searching for: ${query}\n\n(In production, this would search existing Switchboard resources)`)
  }

  const handleBulkFeedsGenerated = (feeds: FeedConfig[]) => {
    const savedFeeds = localStorage.getItem('savedFeeds')
    const existingFeeds = savedFeeds ? JSON.parse(savedFeeds) : []
    
    feeds.forEach(feed => {
      const feedToSave = {
        ...feed,
        id: feed.id || `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      existingFeeds.push(feedToSave)
    })
    
    localStorage.setItem('savedFeeds', JSON.stringify(existingFeeds))
    alert(`Successfully created ${feeds.length} feeds! Check your profile to manage them.`)
    setShowBulkCreator(false)
  }

  const handleBack = () => {
    playPickupSound()
    setActiveModule(null)
  }

  const handleModuleSelect = (moduleId: BuilderType) => {
    playPickupSound()
    setActiveModule(moduleId)
  }

  // Smart module navigation from universal prompt
  const handleSmartNavigate = (module: BuilderType, parsed?: any) => {
    playPickupSound()
    setActiveModule(module)
    
    // Pre-fill module state if parsed data is available
    // This could be extended to pass the parsed data to each builder
    console.log('Smart navigate to:', module, 'with parsed:', parsed)
    
    // Store parsed data in session storage for the builder to pick up
    if (parsed) {
      sessionStorage.setItem('smartPromptData', JSON.stringify({ module, parsed }))
    }
  }

  const handleConfigGenerated = (config: any, type: BuilderType) => {
    switch (type) {
      case 'feed':
        setFeedConfig(config)
        setActiveModule('feed')
        break
      case 'function':
        setFunctionConfig(config)
        setActiveModule('function')
        break
      case 'vrf':
        setVRFConfig(config)
        setActiveModule('vrf')
        break
      case 'secret':
        setSecretConfig(config)
        setActiveModule('secret')
        break
    }
  }

  const renderBuilder = () => {
    switch (activeModule) {
      case 'feed':
        return <FeedBuilder config={feedConfig} onConfigChange={setFeedConfig} />
      case 'prediction':
        return <PredictionMarketBuilder />
      case 'function':
        return <FunctionBuilder config={functionConfig} onConfigChange={setFunctionConfig} />
      case 'vrf':
        return <VRFBuilder config={vrfConfig} onConfigChange={setVRFConfig} />
      case 'secret':
        return <SecretBuilder config={secretConfig} onConfigChange={setSecretConfig} />
      case 'weather':
        return <WeatherBuilder />
      case 'sports':
        return <SportsBuilder />
      case 'social':
        return <SocialBuilder />
      case 'ai-judge':
        return <AIJudgeBuilder />
      case 'custom-api':
        return <CustomAPIBuilder />
      default:
        return null
    }
  }

  const getModuleTitle = () => {
    const module = MODULES.find(m => m.id === activeModule)
    return module?.title || ''
  }

  return (
    <main className="min-h-screen">
      <Header />
      
      {!activeModule ? (
        // Landing view: Hero + Module Grid
        <div className="container mx-auto px-4 max-w-5xl">
          <HeroSection />
          
          {/* Quick Command Bar - Universal Smart Prompt */}
          <div className="mb-12 max-w-2xl mx-auto">
            <CommandBar
              onModuleNavigate={handleSmartNavigate}
              onSearch={handleSearch}
              isHomepage={true}
              showExamples={true}
            />
          </div>
          
          {/* Module Selection Grid */}
          <div className="pb-20">
            <h2 className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
              Choose a module to get started
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {MODULES.map((module) => (
                <ModuleCard
                  key={module.id}
                  icon={module.icon}
                  backgroundIcon={module.backgroundIcon}
                  title={module.title}
                  description={module.description}
                  onClick={() => handleModuleSelect(module.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Builder view
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb / Back navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-feedgod-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to modules</span>
            </button>
            
            <div className="flex items-center gap-3">
              {activeModule === 'feed' && (
                <button
                  onClick={() => setShowBulkCreator(true)}
                  className="px-4 py-2 bg-feedgod-dark-secondary hover:bg-feedgod-dark-accent border border-feedgod-dark-accent rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Bulk Create</span>
                </button>
              )}
            </div>
          </div>

          {/* Module Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">
              {getModuleTitle()}
            </h1>
          </div>

          {/* Command Bar for this module */}
          <div className="mb-6">
            <CommandBar
              onFeedGenerated={setFeedConfig}
              onFunctionGenerated={setFunctionConfig}
              onVRFGenerated={setVRFConfig}
              onSecretGenerated={setSecretConfig}
              onSearch={handleSearch}
              activeTab={activeModule}
            />
          </div>

          {/* Builder Content */}
          <div className="bg-feedgod-dark-secondary/50 rounded-2xl border border-feedgod-dark-accent backdrop-blur-sm p-6">
            {renderBuilder()}
          </div>
        </div>
      )}

      {/* Bulk Feed Creator Modal */}
      <BulkFeedCreator
        isOpen={showBulkCreator}
        onClose={() => setShowBulkCreator(false)}
        onFeedsGenerated={handleBulkFeedsGenerated}
      />
    </main>
  )
}
